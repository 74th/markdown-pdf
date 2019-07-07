# Customizing Pyhon Shell xonsh

1. xonsh にハマる1つの理由
2. インストール
3. 環境変数やコマンドのエイリアスを設定する
    1. 環境変数
    2. エイリアスやコマンドを追加する
    3. Pythonパッケージとして.xonshrcを管理する
4. Shellの中でPythonを使う技術
5. Shellプロンプトをカスタマイズする
    1. 基本のカスタマイズ
    2. git の表示をカスタマイズする
    3. kubernetes の現在のコンテキスト、名前空間を表示する
6. 標準機能のカスタマイズ
    1. Shell設定変更
    2. Shellの機能強化
    3. 補完機能
    4. プロンプトのカスタマイズ機能強化
    5. その他変数
7. キーバインドをカスタマイズする
    1. その前に標準のキーバインドの確認
    2. キーバインドを追加する
    3. pecoで入力候補を扱う
8. タブ補完を作る
9. イベントを使う
    1. イベントとは
    2. コマンドに引数を、条件や環境変数から自動的に追加する
10. xontrib
    1. xontribを使う
    2. xontribパッケージを作る
* あとがき xonsh への思い
* 書いた人

<div class="page"/>

# 1. xonsh にハマる1つの理由

本書は Python で実装された Shell である xonsh の Fan Book である。
xonsh の導入方法とともに、xonsh を自分好みにカスタマイズする方法を紹介する。

筆者が実感しているxonshの良い部分は以下に尽きる。

* .Bashrc を Python で書くことができる

自分の好みの Shell を作るため、 .bashrc や .zshrc を時間をかけて熟成させるものがが、それを Shell Script で書くことが苦痛で仕方がなかった。
sed、jq、grep、wc、test……、これらのツールと戦う必要があることも、Shell Scriptで辛いことの一つだ。
カスタマイズしなくても良い便利な Shell として、同じく Python で書かれた fish Shell があるが、それに満足できずにカスタマイズしようと思うと、 fish の文法を覚える必要があり、fish もまた辛いものに感じてしまった。
一方、xonsh であれば、 xonsh 独自文法もあるが、それは Python の文法上位集合であるため、全て Python で設定を書くこともできる。

xonsh のユースケースには以下の2つがある。

* ユーザの操作を受けるコマンドプロセッサとして
* Python と Shell の文法を混ぜた xonsh Script を実行するコマンドプロセッサとして

筆者の場合は、 xonsh はユーザの操作を受けるコマンドプロセッサして使い、 Shell Script の代用としては Invoke を使っている。
Invoke は Python で柔軟にコマンドを記述できるタスクランナーである。
本書はユーザ操作を受けるコマンドプロセッサとしての xonsh の使い方を紹介し、さらにそのカスタマイズ方法を紹介する本である。
xonshと、Invokeの公式ドキュメントは以下にある。

* xonsh 公式ドキュメント https://xon.sh (xonsh.orgは古い)
* Invoke 公式ドキュメント http://www.pyinvoke.org/

なお、本書で用いているxonshのバージョンは0.8.11であるが、本書の内容は、このバージョンであれば確実に使えることや、今後も使えることを保証しない。

本書ではxonsh上でのコマンドの実行を以下のように記述する。
`>>>`の行は実行するコマンドの1行目を示し、`...`はコマンドの2行目以降、接頭辞記号のない行はコマンドの出力を示す。

```
>>> ls -al
total 2752
drwxr-xr-x  17 nnyn  staff      544 Mar 17 18:27 .
drwxr-xr-x+ 72 nnyn  staff     2304 Mar 17 09:48 ..
-rw-r--r--@  1 nnyn  staff    66966 Mar 16 17:50 Contents.html
-rw-r--r--   1 nnyn  staff    53513 Mar 17 18:27 Contents.md
-rw-r--r--@  1 nnyn  staff  1011326 Mar 17 14:42 Contents.pdf
```

`>>>`を含まないコードはPython3、もしくはxonsh Scriptを示す。

<div class="page"/>

# 2. インストール

xonsh の実行には、Python3.4以上が必要である。
インストールには、pipを用いる。

```
>>> pip install xonsh[ptk]
```

インストール後にコマンドxonshを実行することで、xonshは起動する。
MacではHomebrewを使ってインストールすることもできるが、他のPyPIパッケージを導入することも考慮すると、pipを使って導入することをおすすめする。
ptkはPython Prompt Toolkitを同時にインストールして使用するオプションである。

xonshはPython3でなければ動作しないため、Mac環境ではHomebrewで先にPython3をインストールしておく必要がある。

```
>>> brew install python@3
```

HomebrewインストールしたPython3に対してPyPIパッケージをインストールするには、`/usr/local/bin/pip3`を使う。

```
>>> /usr/local/bin/pip3 install xonsh[ptk]
```

xonshの外部パッケージxontribをインストールするときも、このpipを使うことになる。
またxonsh実行中は、xonshが起動している環境のpipを使うコマンドとして`xpip`というコマンドが追加されるため、こちらを使うと良い。

<div class="page"/>

# 3. 環境変数やコマンドのエイリアスを設定する

## 3.1. 環境変数


環境変数を設定するには、2つの方法がある。

一つは、`$VI_MODE`のように、頭文字に`$`のつく変数を定義することである。

```
>>> $VI_MODE = "1"
```

また、Python の文法の範囲内だけで行いたい場合、以下のように実装する。

```
>>> __xonsh__.env["VI_MODE"] = "1"
```

`__xonsh__`はxonshを実行するPython環境が持つxonshランタイムのオブジェクトであり、
`__xonsh__.env`はdict型のようにアクセスできる環境変数のオブジェクトである。


特定のディレクトリ(`~/.pyenv/`)が存在する場合のみ、環境変数にそのディレクトリのパスを追加するコードを記述したい場合、`~/.xonshrc`に以下のコードを追加することで実現できる。

```python
import os
def _add_path_if_exists(path: str):
    # 引数のパスの存在チェック
    if  os.path.exists(path):
        # 存在する場合、パスに追加する
        __xonsh__.env["PATH"].insert(0, path)

_add_path_if_exists("/usr/local/cuda/bin")
```

パスの存在チェックなどのロジックは、Pythonの機能を使うことができる。

`$PATH`、もしくは`__xonsh__.env["PATH"]`は配列として扱うことができ、PATHの先頭にパス追加するためには、配列の操作である`.insert(0, path)`を利用して行うことができる。

xonsh の設定ファイルは、`~/.xonshrc`に記述する。
これは起動時に実行される xonsh Script であり、 Python もしくは xonsh Script の文法で記述することができる。


## 3.2. エイリアスやコマンドを追加する

コマンドに対して、エイリアスの設定は`aliases`オブジェクトに対して行う。
このオブジェクトはDict型と同じように扱うことができる。

```
>>> aliases['push'] = 'git push'
```

`aliases`にはPython関数を登録することもできる。
この関数はxonsh上の関数のため、Shellコマンドを実行することができる。

```
def git_pushpush(args):
    # とにかく全部コミットしてプッシュする危険なコマンド
    git add -A
    git commit -m "up"
    git push
    return 0

aliases["pushpush"] = git_pushpush
```

```
>>> pushpush
```

このときの関数の第1引数argsには、strのリストでコマンドの引数が渡される。
また、第2引数stdin、第3引数stdout、第4引数stderrを関数に追加すると、ファイルライクオブジェクトとして標準入力、出力、エラー出力を扱うことができる。

## 3.3. Pythonパッケージとして.xonshrcを管理する

先に注意点を述べると、この節はxonshの一般的なtipsではない。
よりxonshの設定をPythonパッケージとして管理したい場合に有効なtipsである。

xonshのカスタマイズを記述する時に、PythonのIDEを使おうとすると、3つの問題がある。

1. xonshのコマンド実行の構文はPythonの文法チェックツールではエラーになってしまう。
2. xonshが参照可能なPyPIパッケージは、xonshがインストール環境に限られるため、`.xonshrc`だけではパッケージの構造化が難しい。
3. xonshランタイムである`__xonsh__`を参照する必要があるが、`builtins`パッケージに登録されているため、mypyによる静的解析ではエラーになってしまう。

1.の問題は、コマンド実行の構文を使わず、すべて`__xonsh__`オブジェクトを介した実行にすることで解決できる。
2.の問題は、筆者は`~/dotfiles/xonsh/`のディレクトリ下に初期化スクリプトで使いたいパッケージは全て収め、`.xonshrc`からそのディレクトリへ参照するように設定して解決している。

```python
def __append_xonshrc_path():
    import sys
    import os
    xonsh_conf = os.path.join(os.environ["HOME"], "dotfiles", "xonsh")
    sys.path.append(xonsh_conf)

__append_xonshrc_path()

import xonsh_conf
xonsh_conf.load()
```

3.の問題は、`builtins.__xonsh__`への参照を持つパッケージを作成し、xonshのカスタマイズを記述するファイルはそのファイルへの参照するようにして解決した。
そのため、ディレクトリ構成は以下のようにしている。

* `~/`
    * `.xonshrc` 最初に読み込まれるファイル
    * `dotfiles/xonsh/`
        * `xonsh_conf/`
            * `__init__.py` カスタマイズで実行するファイル
            * `prompt.py`
            * `xonsh_builtin/`
                * `__init__.py` `builtins.__xonsh__`への参照を持つファイル


繰り返しになるが、通常は`~/.xonshrc`にPythonとコマンド実行の構文のスクリプトを追加していけば十分である。

<div class="page"/>

# 4. Shellの中でPythonを使う技術

xonsh は Python のスーパーセットであり、Python の文法をすべて使うことができるが、Bashのようにコマンドを実行して、その結果をPythonで処理することもできる。

xonsh でスペースで区切られたコマンドを実行すると、そのコマンドがそのまま実行される。

```
>>> ls
Contents.html    Contents.md      Contents.pdf     README.md
```

`$(xcommand)`と入力すると、そのコマンドの標準出力がPythonの文字列として返却される。

```
>>> $(ls)
'Contents.html\nContents.md\nContents.pdf\nREADME.md\n"
>>> l = $(ls)
>>> print(l)
Contents.html
Contents.md
Contents.pdf
README.md

>>> l.split("\n")
['Contents.html',
 'Contents.md',
 'Contents.pdf',
 'README.md',
 '']
```

これを使えば、JSONで出力されるAPIやコマンドが簡単に扱えるようになる。

```
>>> import json
>>> res = $(gcloud container clusters list --format json)
>>> clusters = json.loads(res)
>>> for cluster in clusters:
...     print(cluster["name"])
sandbox-1
sandbox-2
```

逆にShellコマンドの中でPythonを実行したい場合、`@(cmd)`を使う。
Pythonの実行結果を引数に使うことができる。

```
# Pythonとしてfor文で書き始め
for i in range(10):
    # 実行する行がコマンド実行になっても良い
    mkdir @("test_" + str(i))
```

なお、この例のように、Pythonの文法とコマンド実行の構文は行単位で混在させることが可能である。

Python の str として構築したコマンドを実行したい場合、コマンドとその引数を配列として渡す必要がある。
以下の例では、Python のフォーマット文字列を使ってコマンドを作成し、それをスペースで区切った配列に変換して実行している。

```
project = "nnyn-personal"
cmd = f"gcloud --project {project} container cluster list"
@(cmd.split(" "))
```

スペースで区切るのが適切ではない実行可能なコマンドのテキストの場合、`__xonsh__.execer.eval(cmd)`を使うことで、同じように実行させることができる。
ただし、この場合標準出力を得ることはできない。

標準エラー出力が必要な場合、`!(cmd)`を使い、戻り値のHiddenPipelineオブジェクトを処理する。

Shell コマンドとして実行する場合、pipe や、 標準入力、出力、標準エラー出力もBashと同様に扱うことができる。

```
>>> target = "dev"
>>> manifest = f"manifest/{$target}/app.yaml"
>>> cat @(manifest) | kubectl apply -
```

<div class="page"/>

# 5. Shellプロンプトをカスタマイズする

## 5.1. 基本のカスタマイズ

プロンプトを変更するには、`$PROMPT`変数にプロンプトの書式を格納する。
`{user}`のように`{}`で囲ったタグが、関数や変数として展開されて置き換わるようになっている。

xonsh では以下のタグが既に用意されている。
なかには別の変数によって、定義を変更できるものもある。

* `{user}` 現在のユーザ。
* `{hostname}` ホスト名。
* `{cwd}` 現在のディレクトリのパス。環境変数`$DYNAMIC_CWD_WIDTH` で最大文字数を設定する。
* `{short_cwd}` `/p/t/xonsh`のようにカレントディレクトリ以外を短くした現在のディレクトリのパス。
* `{cwd_base}` 現在のディレクトリ名のみ。パスは含まない。
* `{prompt_end}` super user の場合 `#` 、それ以外の場合 `$`。

色を変更するには、`{BLACK}`、`{INTENSE_BLACK}`、 `{RED}`、`{INTENSE_RED}`、 `{GREEN}`、`{INTENSE_GREEN}`、 `{YELLOW}`、`{INTENSE_YELLOW}`、 `{BLUE}`、`{INTENSE_BLUE}`、 `{PURPLE}`、`{INTENSE_PURPLE}`、 `{CYAN}`、`{INTENSE_CYAN}`、 `{WHITE}`、`{INTENSE_WHITE}` を使う他、RGBコードで指定する`{#fafad2}`ことも可能である。
背景色を変更するには`{BACKGROUND_RED}`というようにする。
プロンプトの最後などで、色の設定を消すには`{NO_COLOR}`を利用する。

Python の関数を使って文字を出力させたい場合、`$PROMPT_FIELDS`というdict型に、文字列を返す関数を定義する。
たとえば、終了コードが0以外の場合にのみ、終了コードを赤字で表示したい場合、以下のように実装する。

```python
def x_exitcode():
    # 終了コードは`__xonsh__.history.rtns`に格納されている。
    if __xonsh__.history.rtns is None:
        return 0
    if len(__xonsh__.history.rtns) > 0:
        return builtins.__xonsh__.history.rtns[-1]
    return 0

# プロンプトで使う関数を登録する。
$PROMPT_FIELD["exit"] =
    lambda: "" if x_exitcode() == 0 else str(x_exitcode()) + " "
# プロンプトに`{exit}`を追加する。
$PROMPT = "{RED}{exit}{WHITE}{cwd} "
```

また、ホスト名やユーザ名によって色を変更したい場合は、その変更を関数として定義しなくても、Python文法を使って実装することができる。

```python
prompt = "{RED}{exit}{WHITE}"
if os.environ.get("USER", "nnyn") == "root":
    prompt += "{RED}"
else:
    prompt += "{GREEN}"
prompt += "{user}{WHITE}@"
$PROMPT = prompt
```

`$PROMPT`の他にも、以下のようなのプロンプトを拡張する環境変数が用意されている。
これらは`$PROMPT`と同じ構文で記述できる。

* `$BOTTOM_TOOLBAR` ターミナルの最下部に表示する
* `$RIGHT_PROMPT` 右端に表示する
* `$TITLE` ターミナルエミュレータのタイトルに表示するテキスト

## 5.2. git の表示をカスタマイズする

git の状態を示すプロンプトで使うことができる値として、以下のタグが定義されている。

* `{curr_branch}` 現在の git ブランチ名
* `{gitstatus}` git の現在の状態

`{gitstatus}` を `$PROMPT` に追加するだけでも十分有用である。

これに加えて、以下の変数で色を変えたり、アイコンを付加するすることができる。
カッコ内は初期値である。

* `{XONSH_GITSTATUS_HASH}` ハッシュ値(`:`)
* `{XONSH_GITSTATUS_BRANCH}` ブランチ名(`{CYAN}`)
* `{XONSH_GITSTATUS_OPERATION}` REBASE、MERGINGなどのオペレーション名(`{CYAN}`)
* `{XONSH_GITSTATUS_STAGED}` staging されているファイルの数(`{RED}●`)
* `{XONSH_GITSTATUS_CONFLICTS}` 競合したファイルの数 (`{RED}×`)
* `{XONSH_GITSTATUS_CHANGED}` 変更して staging されていないファイルの数 (`{BLUE}+`)
* `{XONSH_GITSTATUS_UNTRACKED}` tracking されていないファイルの数 (`…`)
* `{XONSH_GITSTATUS_STASHED}` stash の数 (`⚑`)
* `{XONSH_GITSTATUS_CLEAN}` クリーンの場合 (`{BOLD_GREEN}✓`)
* `{XONSH_GITSTATUS_AHEAD}` push されていないコミットの数 (`↑·`)
* `{XONSH_GITSTATUS_BEHIND}` pull されていないコミットの数 (`↓·`)

筆者の場合、以下のようなことを加えて行っている。

* master の場合`🌟`マークを付ける。目出つため、誤って master に push してしまうことを防ぐ。
* stash の数だけ、`🌵`マークをつける。stashにしてコミット漏れがないようにすることや、stashの数が増えて`🌵🌵🌵🌵`と表示されたときに、なんとかしないといけない気持ちになる。

gitstatusの実装は以下にある。
いちから関数を構築するよりも、このgitstatusの実装から好みのgitの表示にカスタマイズすれば良い。

* https://github.com/xonsh/xonsh/blob/master/xonsh/prompt/gitstatus.py

上記の絵文字をつける機能を実現するため、gitstatus関数を以下のように書き換えている。

```python
ret = ""
if s.branch == "master":
    ret += "🌟"
ret += "{YELLOW}" + s.branch
```

```python
if s.stashed > 0:
    ret += " " + "🌵"* s.stashed
ret += "{NO_COLOR}"
```

## 5.3. kubernetes の現在のコンテキストと名前空間を表示する

kubernetes を使っていて、Dev環境、QA環境、Prod環境と複数のクラスタを管理しているため、現在どのクラスタのコンテキストを使っているのか、さらにはどの名前空間を使っているのか、プロンプト上に表示したいと考えた。

kubernetes の現在のコンテキストは、`~/.kube/config` といファイルにYAML形式で保存されている。
現在のコンテキストの名前はcurrent-contextという属性に格納されている。
さらに、名前空間はコンテキストの配列から同一の名前のコンテキストを検索し、その中のnamespaceという属性を参照する。
namespaceという属性がない場合、defaultという名前の名前空間が使われる。

PythonでYAMLをJSONと同様に扱うことができるパッケージとして、PyYAMLがある。

* PyYAML https://pyyaml.org/wiki/PyYAML

プロンプトを表示するたびに、このファイルを読み込み、YAMLをパースする処理を行うよう実装した。
そうするとプロンプトの表示が少し遅くなった。
コマンドの入力のたびにプロンプトが遅いことはストレスになるため、以下の変更を加えた。

* 抽出したコンテキスト、名前空間と、`~/.kube/config`の変更時刻を、グローバル変数に持っておき、変更時刻が変わらない場合、グローバル変数中の値を返す。

実装は以下のようになる。

```python
import os
import yaml

kubeconf_ctime = 0.0
kubeclient_current_context = ""

def current_kubernetes_context() -> str:
    global kubeconf_ctime
    global kubeclient_current_context

    # kubenetes の設定ファイルのパス
    config_path = os.path.join(os.environ["HOME"], ".kube", "config")
    if not os.path.exists(config_path):
        return ""

    # 設定ファイルの現在時刻を確認し、
    # 変更されていない場合、前回の結果を返す
    current_kubeconf_ctime = os.stat(config_path).st_ctime
    if current_kubeconf_ctime == kubeconf_ctime:
        return kubeclient_current_context
    kubeconf_ctime = current_kubeconf_ctime

    # 変更されている場合、YAMLをパースして、
    # ネームスペース、コンテキスト名を抽出する
    with open(config_path) as f:
        kubeconf = yaml.load(f.read().strip())
    context_name = kubeconf.get("current-context", "")

    namespace_display_name = ""

    if context_name.startswith("gke"):
        context_display_name = context_name.split("_")[-1]
    else:
        context_display_name = context_name

    for context in kubeconf["contexts"]:
        if context["name"] == context_name:
            namespace_display_name = context["context"]
                .get("namespace", "default")
            break
    kubeclient_current_context =
        f"{context_display_name}:{namespace_display_name}"

    return kubeclient_current_context

~
prompt += "{BLUE}{kubernetes}{WHITE} "
$PROMPT = prompt
$PROMPT_FIELDS["kubernetes"] = current_kubernetes_context
```

このような処理を全てShell Scriptでも行うことができるが、その実装はPythonほど簡単ではない考えられる。
xonshを使って、Pythonで高速に実装することができることで、もっと他の有意義なこと(.vimrcの編集など)ができるようになる。

<div class="page"/>

# 6. 標準機能のカスタマイズ

xonshの挙動は、環境変数を変更することでカスタマイズできる。
xonshで有効なすべての環境変数を紹介する。
以下は初期設定ではなく、変更例を記載している。
記載の機能を実現したい場合、以下を`.xonshrc`に追加する必要がある。

## 6.1. Shell設定変更

* `$COMPLETIONS_CONFIRM = False` 初期設定では、補完候補を選択してEnterを押した時、一度補完を適用してすぐには実行しない。`False`に設定するとEnterで補完候補の選択と同時にコマンド実行されるようにする。
* `$DIRSTACK_SIZE = 100` pushd、popdのスタックサイズ。初期値は20に設定されている。
* `$DOTGLOB = True` `*`、`**`で検索した時に、`.git`など`.`で始まるファイルは`.*`のように検索しない限りヒットしないようになっている。`True`をセットすることでヒットするようにする。
* `$EXPAND_ENV_VARS = False` サブプロセスモードで起動するタスクに環境変数を渡すかどうか。初期設定は渡すようになっている。
* `$FOREIGN_ALIASES_OVERRIDE = True` xonshのコマンドをエイリアスで上書きできるようにする。初期設定では`False`でできないようになっている。
* `$FOREIGN_ALIASES_SUPPRESS_SKIP_MESSAGE = True` 初期設定ではxonshのコマンドをエイリアスで上書きした時に、警告メッセージが表示される。`True`に設定することで、その警告を表示しないようにする。
* `$GLOB_SORTED = False` 初期設定では`*`を用いたGlob検索において自動で検索結果をソートする。`False`に設定することにより、ソートしないようにする。
* `$HISTCONTROL = set("ignoreerr","ignoredups")` ヒストリーに残すコマンドを制限する。初期設定`set()`では全てのコマンドを残す。`"ignoreerr"`を入れるとエラーは除外される。`"ignoredups"`を入れると重複は除外される。
* `$IGNOREEOF = True` Ctrl-Dを押してもShellが終了しないようにする。
* `$INDENT = False` 複数行の入力の時初期設定では自動でインデントする。`False`にすることで、インデントしないようにする。
* `$INTENSIFY_COLORS_ON_WIN = False` Windowsでコマンドプロンプト(cmd.exe)を使用する時、可読性の高い配色にする機能が初期設定で有効になっている。`False`に設定することで、それを無効にする。
* `$LANG = "C.UTF-8"` ロケールの設定に失敗した時に使うロケール。
* `$LS_COLORS` `ls`コマンドで表示されるファイルの色を拡張子ごとに設定する。
* `$MULTILINE_PROMPT = '_'` 改行した時に表示される文字。
* `$PATH` 実行可能プログラムを検索するパスのリスト。
* `$PATHEXT = [".exe"]` 実行可能プログラムの拡張子のリスト。初期設定では$PATH下のファイルは拡張子関係なく、すべて含まれる。
* `$PUSHD_SILENT = True` pushd、popdコマンドは、初期設定では標準出力にディレクトリを表示する。`True`に設定するとそれを抑制する。
* `$SHELL_TYPE` 使うShell(`readline`、`prompt_toolkit`)を選択する。`random`、`best`という選択肢もある。
* `$SUBSEQUENCE_PATH_COMPLETION = False` 初期設定では、タブ補完において、`~/u/ro`のパスが`~/lou/carcolh`にマッチするようになっている。`False`にすることで、マッチしないようにする。
* `$SUGGEST_COMMANDS = False` プログラム名が誤っていて、コマンドが実行できない場合、似たプログラム名を表示する機能がある。`False`に設定すると、それを無効にする
* `$SUGGEST_MAX_NUM = 10` 似たプログラム名を表示する機能の表示する最大数。初期値は5。
* `$SUGGEST_THRESHOLD = 10` 似たプログエラム名を表示する機能の、レーベンシュタイン距離の閾値。初期値は3。
* `$SUPPRESS_BRANCH_TIMEOUT_MESSAGE = True` git等のブランチの取得に時間がかかる場合、タイム・アウトした旨のメッセージが表示される。`True`を設定するとそれを抑制する。
* `$XDG_DATA_HOME = '~/Dropbox/share'` 履歴などを保存するシステムのデータディレクトリを変更する。
* `$XONSH_DATA_DIR = '~/Dropbox/share/xonsh'` 履歴などを保存するデータディレクトリとして初期設定では`$XDG_DATA_HOME/xonsh`を使うようになっているが、これを変更する。
* `$XONSH_APPEND_NEWLINE = False` 出力が改行で終わらない場合、最後に改行が挿入されるようになっている。`False`に設定することで、それを無効にする。
* `$XONSHRC += ["~/dotfiles/xonsh/xonshrc"]` コントロールファイルの場所を追加する。
* `$XONSH_CACHE_SCRIPT = False` Pythonのキャッシュを使うようになっている。`False`にすることでキャッシュを無効にする。
* `$XONSH_COLOR_STYLE = "autumn"` 配色を変更する。配色の名称の一覧は`xonfig styles`で確認できる。変更した配色は`xonfig colors`で確認できる。
* `$XONSH_DATETIME_FORMAT = "%Y/%m/%d %H:%M"` xonshで使われる日付フォーマットを変更する。標準は`%Y-%m-%d %H:%M`になっている。
* `$XONSH_ENCODING = 'utf-8'` サブプロセスを実行するしたときの入出力に使うエンコーディングを指定する。
* `$XONSH_ENCODING_ERRORS = 'ignore'` エンコーディングエラーが発生した場合の挙動を設定する。初期設定では`surrogateescape`、サロゲートペア文字のみ置き換えるようになっている。
* `$XONSH_HISTORY_BACKEND = "sqlite"` xonshのヒストリーの保存に使われるデータの形式を設定する。初期設定では`json`になっている。
* `$XONSH_HISTORY_SIZE = '3 months'` ヒストリーのサイズ。初期設定では8128コマンド`(8128, 'commands')`に指定されている。この指定には、ファイル数を使う`(10, 'files')`や、容量を使う`1 GB`の設定もできる。
* `$XONSH_PROC_FREQUENCY = 0.001` パイプライン処理を行う時に、xonshのプロセスがスリープする周期。初期設定では、`0.0001`(0.1ms)が設定されている。
* `XONSH_SHOW_TRACEBACK = True` xonsh内でエラーが発生した時、初期設定ではトレースバックを表示しないようになっている。`True`に設定すると、表示するようにする。
* `$XONSH_TRACEBACK_LOGFILE = '/var/log/xonsh_error'` xonsh内でエラーが発生した時、初期設定ではトレースバックを保存しないが、指定したパスに保存させるようにする。

## 6.2. Shellの機能強化

Bash以上の機能が得られる設定を紹介する。

* `$AUTO_CD = True` cdを押さずにディレクトリ名だけでcdできる。
* `$AUTO_PUSHD = True` cdするだけでpushdに自動で入れる。
* `$AUTO_SUGGEST = False` `False`に設定すると、入力途中のサジェスト機能を無効にする。
* `$AUTO_SUGGEST_IN_COMPLETIONS = True` 補完の最初の項目をサジェストの結果を追加する。
* `$CDPATH = ("/Users/nnyn/")` パスを登録しておくと、そこがルートとしてcdで移動できるようになる。この設定例ではどのディレクトリからでも`cd Documents`で、`/Users/nnyn/Documents`に移動できる。
* `$MOUSE_SUPPORT = True` Prompt Toolkitで使えるマウス操作を有効にする。
* `$UPDATE_COMPLETIONS_ON_KEYPRESS = True` 初期設定では、タブを押したときに初めて補完候補が表示される。`True`に設定することで、入力途中に自動的に補完候補を表示する。
* `$UPDATE_OS_ENVIRON = True` `$xxx`で環境変数を操作した場合に、`os.environ`も変更する。
* `$VI_MODE = True` VIモードを有効にする。なお、VIモードの実現にはPython Prompt Toolkitがもつ機能を使っている。
* `$XONSH_AUTOPAIR = True` 閉じ括弧を自動で入力する。
* `$XONSH_CACHE_EVERYTHING = True` Shell上で入力したコードに対してもPythonのキャッシュが効く様にする。
* `$XONSH_HISTORY_MATCH_ANYWHERE = True` ヒストリーのマッチを先頭以外でもマッチするようにする。
* `$XONSH_STDERR_PREFIX='{BACKGROUND_RED}'` `$XONSH_STDERR_POSTFIX='{NO_COLOR}'` 標準エラーを出力する時の前後につける設定。色を変えて表示するなどができる。
* `$XONSH_STORE_STDIN = True` `!()`、`![]`を実行した時の戻り値はCommandPipeline、HiddenCommandPipilineであるが、それに標準入力をデフォルトでは格納しないが、格納するようにする。
* `$XONSH_STORE_STDOUT = True` ヒストリーファイルに標準出力、標準エラー出力を含めないようになっているが、含めるようにする。

## 6.3. 補完機能

* `$BASH_COMPLETIONS = '/usr/local/etc/bash_completion'` bash_completionのインストール場所。基本的に自動的に判定するため、指定する必要はない。
* `$CASE_SENSITIVE_COMPLETIONS = False` 大文字小文字を区別して補完を行う。LinuxではデフォルトはTrue、それ以外はFalseである。
* `$COMPLETIONS_BRACKETS = False` Pythonの補完候補に、`(`、`[`が含まれるが、それを含まないようにする。
* `$COMPLETIONS_DISPLAY = "single"` 補完の表示の有無の設定。デフォルトは`"multi"`で複数列の補完が表示されるが、`single`では1列縦に表示されるようになる。`None`で補完を無効にする。
* `$COMPLETIONS_MENU_ROWS = 5` 補完で表示される行数。初期値は5に設定されている。
* `$COMPLETION_QUERY_LIMIT = 100` 補完候補として検索する最大数。初期値は100に設定されている。
* `$FUZZY_PATH_COMPLETION = False` タブ補完において、初期設定では`xonsh`ディレクトリに`xonhs`でもマッチングする曖昧検索が有効になっている。`False`に設定すること、それを無効にする。

## 6.4. プロンプトのカスタマイズ

* `$PROMPT` プロンプトの設定。
* `$BOTTOM_TOOLBAR = "{hostname}"` ターミナルの最下部にプロンプトを追加する。記述方法は`$PROMPT`と同じ。
* `$RIGHT_PROMPT - "{hostname}"` 右端に表示するプロンプトを追加する。記述方法は`$PROMPT`と同じ。
* `$TITLE = "{hostname}"` ターミナルエミュレータのタイトルに表示するテキスト。記述方法は`$PROMPT`と同じ。
* `$DYNAMIC_CWD_WIDTH = 10` `{cwd}`の最大文字数。カレントディレクトリのパスの長さがこれを超える場合、`...`と表示されて区切られる。初期設定は`inf`となっている。
* `$DYNAMIC_CWD_ELISION_CHAR = ".."` `{cwd}`で表示されるカレントディレクトリが`$DYNAMIC_CWD_WIDTH`を超えた場合に表示される文字列。初期設定は`...`となっている。
* `$COLOR_INPUT = False` `False`に設定すると、入力のシンタックスハイライトを無効にする。
* `$COLOR_RESULTS = False` `False`に設定すると、出力した値のシンタックスハイライトを無効にする。
* `$PRETTY_PRINT_RESULTS = False` 初期設定ではPretty Printが有効になっている（dictを継承している型は内容を出力するなど）。`False`に設定するとそれを無効にする。
* `$PROMPT_FIELDS` プロンプトの中で実行する関数を登録する。
* `$PROMPT_TOOLKIT_COLOR_DEPTH = "DEPTH_1_BIT"` カラーの色数の設定。デフォルトでは、Prompt Toolkitの指定する値になる。`"DEPTH_1_BIT"`、 `"DEPTH_4_BIT"`、 `"DEPTH_8_BIT"`、`"DEPTH_24_BIT"`が指定できる。
* `$PTK_STYLE_OVERRIDES` Prompt Toolkitのスタイルの設定。
* `$UPDATE_PROMPT_ON_KEYPRESS = True` プロンプトの変更をキー押下ごとに行う。
* `$VC_BRANCH_TIMEOUT = 0.2` プロンプトで使うgit、hgのブランチの取得のタイムアウト。初期値は0.1。
* `$VC_HG_SHOW_BRANCH - False` 初期設定では、プロンプトで使うgit、hgのブランチを取得するようになっている。`False`に設定すると、それを無効にする。
* `$XONSH_GITSTATUS_*` Gitのプロンプトの表示を変える。5.1.節参照。
*

## 6.5. その他変数

* `$FORCE_POSIX_PATHS` Windowsでもパスの区切りとして`/`を使うようになっているか。
* `$RAISE_SUBPROC_ERROR = True` サブプロセスで発生したエラーをキャプチャして、xonshのメインスレッドまでライズするようにする。
* `$OLDPWD` 直前のディレクトリのパスが入っている変数。
* `$VIRTUAL_ENV` 現在有効になているPythonの環境。
* `$WIN_UNICODE_CONSOLE` Windowsターミナルにおいてユニコードをサポートしているかどうか。
* `$XDG_CONFIG_HOME` 標準の設定のホームディレクトリ。`~/.config`など。
* `$XONSH_CONFIG_DIR` xonshの設定ディレクトリ。
* `$XONSH_DEBUG` デバッグモードでxonshを起動しているかどうか。
* `$XONSH_INTERACTIVE` プロンプトのあるインタラクティブシェルとして起動しているかどうか。
* `$XONSH_LOGIN` ログインシェルとして起動しているかどうか。
* `$XONSH_SOURCE` xonsh Scriptを実行している時、その元のソースのパス。
* `$PUSHD_MINUS` pushd、popdの挙動を変更する機能のようだが、不明。

<div class="page"/>

# 7. キーバインドをカスタマイズする

## 7.1. その前に標準のキーバインドの確認

xonshをPython Prompt Toolkit(以下ptk)と一緒にインストールした場合、Bash(Emacs or Readline)同様の以下のキーバインドが有効になる。

* `C-a` 行頭に移動する。
* `C-f` 1文字前に移動する。
* `C-e` 1文字後ろに移動する。
* `C-e` 行末に移動する。
* `C-p` 1行上に移動する。前の履歴を表示する。
* `C-n` 1行下に移動する。次の履歴を表示する。
* `C-h` 前の1字を削除する。
* `C-d` 後ろの1字を削除する。
* `C-w` 前の単語を削除する。
* `C-u` カーソルより前の文字をすべて削除する。
* `C-k` カーソルより後ろの文字をすべて削除する。
* `C-y` 削除した単語の貼り付ける。
* `C-t` 直前の文字とその文字を入れ替える。
* `C-r` 履歴を検索する。複数回押すと更にさかのぼる。
* `C-s` 履歴を前方に検索する。複数回押すとさらに前方に進む。
* `C-u` 入力、削除を取り消す。

補完候補を表示している時には、以下のキーバインドが有効になる。

* `tab` `C-n` 次の候補へカーソルを移動する。
* `S-tab` `C-p` 前の候補へカーソルを移動する。
* それ以外の文字では、現在の選択中の候補を確定して次の文字を入力する。

また、入力中に、入力している文字にかぶさるように表示されるサジェスト機能がある。
サジェストを表示している時は以下のキーバインドが有効になる。

* `C-e` サジェストの内容を確定する。

ptkは、VIモードが提供されており、xonshでもVIモードが利用できる（筆者は常にVIモードを使っている）。
VIモードにするためには、.xonshrcに以下を設定する。

```
$VI_MODE = True
```

## 7.2. キーバインドを追加する

キーバインドのやり方は、ptkの仕組みを使う。
この節では、筆者の設定している以下のキーバインドの実装例を示す。

* `C-w` で、記号、スペースの直前まで削除する。

`C-w`は初期設定でも単語を削除する機能であるが、単語削除機能の動作はアプリケーションにより違うことも多く、気になっていた。
xonshを使うのだから、これを自分の納得の行く機能に作り変えたいと思った。

キーバインドを追加するには、まず.xonshrcに以下を追加する。

```python
from prompt_toolkit.keys import Keys
from prompt_toolkit.filters import Condition, EmacsInsertMode, ViInsertMode

@events.on_ptk_create
def custom_keybindings(bindings, **kw):
    handler = bindings.add
```

この下に、各キーのイベントを定義する。

```python
@events.on_ptk_create
def custom_keybindings(bindings, **kw):
    handler = bindings.add

    # C-w
    @handler(Keys.ControlW)
    def __ctrl_w(event):

        # `event.current_buffer`から、現在のバッファを取り出す。
        buf = event.current_buffer  # type: prompt_toolkit.buffer.Buffer
        text = buf.text[:buf.cursor_position]  # type: str

        % バッファ中の文字から、削除したい文字数をカウントする。
        m = re.search(r"[/,.=\s][^/,.=\s]+[/,.=\s]?$", text)
        if m is not None:
            buf.delete_before_cursor(len(text) - m.start() - 1)
            return

        # 削除する
        buf.delete_before_cursor(len(text))
```


## 7.3. pecoで入力候補を扱いやすくする

筆者は以下のキーバインドを設定している。

* 特定のコマンドの途中で`C-r`を押すと、pecoを使って入力候補を表示する。またその入力候補の選択すると、コマンドに反映する。

pecoやfzfは曖昧検索と呼ばれる単語の途中の文字でも検索を可能にするコマンドラインツールである。
pecoに対して標準入力で候補となるリストを渡し、標準出力で選択結果を与えることができる。

git addやgit checkoutのコマンドで実行した時に、その候補を選択する機能を実現する。

```python
@events.on_ptk_create
def custom_keybindings(bindings, **kw):
    handler = bindings.add

    # `C-r`を押した時のイベント
    @handler(Keys.ControlR, filter=insert_mode)
    def __ctrl_r_event(event):
        # バッファを読み、コマンドを判定する
        buf = event.current_buffer
        line :str = buf.document.current_line
        if line.startswith("git"):
            select_git(buf)

def run(command: str)->HiddenCommandPipeline:
    return __xonsh__.execer.eval(command)

def select_git(buf):
    '''
    gitのpecoを使った候補選択
    '''
    line :str = buf.document.current_line
    if line.startswith("git checkout"):
        # git checkout

        # gitコマンドの結果を一時ファイルに書き込む
        with tempfile.NamedTemporaryFile() as inputs:
            # ブランチの一覧
            run(f"git branch -a --no-color > {inputs.name}")
            # ステージングされていない変更の一覧
            run(f"git status --short >> {inputs.name}")

            # peco でユーザに選択させ、それを読み込む
            with tempfile.NamedTemporaryFile() as tmp:
                run(f"cat {inputs.name} | peco > {tmp.name}")
                with open(tmp.name) as f:
                    peco: str = f.readline().strip()
        # 選択したテキストをバッファに書き込む
        if len(peco) > 0:
            branch = peco.split(" ")[-1]
            buf.insert_text(" "+branch)
```

一時ファイルの処理などは、Pythonの標準機能を使っている。
筆者の場合は、設定ファイルをすべてPythonの文法で記述しているため、少し煩雑になっているが、`run()`の部分は以下の様に記述することもできる。

```python
def select_git(buf):
    line :str = buf.document.current_line
    if line.startswith("git checkout"):
        # git checkout

        with tempfile.NamedTemporaryFile() as inputs:
            # ブランチの一覧
            git branch -a --no-color > @(inputs.name)
            # ステージングされていない変更の一覧
            git status --short >> @(inputs.name)

            # peco でユーザに選択させ、それを読み込む
            with tempfile.NamedTemporaryFile() as tmp:
                cat @(inputs.name) | peco > @(tmp.name)
                with open(tmp.name) as f:
                    peco: str = f.readline().strip()

        # 選択したテキストをバッファに書き込む
        if len(peco) > 0:
            branch = peco.split(" ")[-1]
            buf.insert_text(" "+branch)
```

Python文法の範囲内で記述することで、mypyでの静的解析や、Visual Studio Codeで補完を有効にした編集が可能になる。

<div class="page"/>

# 8. タブ補完を作る

前節ではpecoを使った候補の選択を実現したが、選択候補が少なければタブ補完で実現すると手軽に使えて良い。

xonshでは、Bashの補完(Bash-Completion)を使ってタブ補完の候補を出すことができる。
lsコマンドの引数や、gitの引数といったよく使われる引数の補完は既にカバーされている。

この節では、標準的ではないツールに関するタブ補完を実装する例を示す。

xonshでタブ補完を実現するには、以下の引数をもつ関数を実装する。

```python
def invoke_completer(prefix:str, line:str, begidx:int, endidx:int, ctx:dict):
    return {"install-bashrc", "install-curl"}
```

引数は以下の通りである。

* prefix スペース区切りの単語のうち、カーソルの単語の前の文字列。スペースを押した直後の場合、空文字となる。
* line 行。
* begidx スペース区切りの単語のうち、カーソルのある単語の開始の文字数。
* endidx スペース区切りの単語のうち、カーソルのある単語の末尾の文字数。
* ctx 実行中のPython環境。

例えば、`inv --`の時にタブ補完を呼び出すと以下のようになる。

* prefix: `--`
* line: `inv --`
* begidx: 4
* endidx: 4

補完の関数群は、`__xonsh__.completers`に順序付き辞書(OrderedDict)型で格納され、先頭にある関数から順に評価される。

関数の戻り値として文字列の集合を返すと、次の補完関数は評価されなくなる。
空の集合`set()`を返すと、次の補完の関数に進む。

xonshの標準では、補完の関数が定義されている。

* pip
* cd のパス
* rmdir のディレクトリ
* xontrib
* Bash-completion
* コマンドのmanページに記載されたオプション
* Pythonライブラリのimport
* ファイルパス

補完の優先順位はファイルパスが最後になっている。
つまり、他の補完の候補が見つからない場合、少なくともファイルパスを補完として表示するようになっている。

筆者は、Shell Scriptの用途ではInvokeというタスクランナーを使っていることを既に述べた。
Invokeコマンドでは以下のコマンドで、タスクの一覧をタブ補完の候補に適切な形で出力することができる。

```
>>> inv --complete
install-bashrc
install-curl
install-fabric
install-xonsh
```

これを使った補完関数を以下のように実装した。

```python
def invoke_completer(prefix:str, line:str, begidx:int, endidx:int, ctx:dict):

    # lineの先頭がInvokeコマンドか否かを判定する
    # Invokeコマンドでない場合、空集合を返却して、他の補完に進ませる。
    if not line.startswith("inv"):
        return set()

    # lineをスペースで区切り、
    # "-f"という、ファイルの指定が必要な引数の引数のタブ補完であるかどうかを判定し、
    # その場合、xonshのパス補完を実行する。
    args = line.split(" ")
    if len(args)>1 and args[-2] == "-f":
        from xonsh.completers.path import complete_path
        return complete_path(prefix, line, begidx, endidx, ctx)

    # タスクの一覧を取得して渡す
    tasks = $("/usr/local/bin/invoke --complete")
    return set(tasks.split("\n"))
```

次に作成したタブ補完の関数を登録する。

登録するには、以下の2つの方法がある。

1. `completer add <function> <POS>`のコマンドを使う。
2. `__xonsh__.completers`に直接追加する。

1.のcompleterコマンドを使う方法が簡単である。
このコマンドの3つ目の引数には優先順位を指定する。
先頭の`start`、Bashの前を示す`>bash`を指定できる。
省略時は`start`なので基本的に、省略すれば良い。

2.の`__xonsh__.completers`を使う場合は以下のような実装になる。
`__xonsh__.completers`は順序付き辞書型のため、先頭に追加するためには、move_to_endメソッドを用いる。

```python
__xonsh__.completes["inv"] = invoke_completer
__xonsh__.completes.move_to_end("inv", False)
```

これで、`inv`コマンドのタブ補完が動作する。

<div class="page"/>

# 9. イベントを使う

## 9.1. イベントとは

xonshには以下のようなイベントが設けられており、任意の関数を実行することができる。

* on_chdir カレントディレクトリが変更された時。
* on_pre_prompt プロンプトが表示される直前。
* on_post_prompt プロンプトが表示された後。
* on_precommand コマンドを実行する直前。
* on_postcommand コマンド実行後。
* on_transform_command コマンドを変換するためのイベント。
* on_exit xonshシェルの終了時。

イベントのリスト、及び各イベントで実行する関数の引数と戻り値は以下から確認できる。

https://github.com/xonsh/xonsh/blob/master/xonsh/xontribs.json

## 9.2. 条件や環境変数から、コマンドに引数を自動的に追加する

最も使い勝手の良いイベントは、`on_transform_command`というコマンドを変換するためのイベントである。
このイベントは、コマンドを実行する前にコマンドが文字列として渡され、コマンドを変換して返すことができる。

特定のコマンドには必ず引数を追加したい場合には、エイリアスが使える。
それ以上の複雑さの要件、例えば引数に環境変数の値を入れたい場合や、既に引数を指定した場合は入れないようにするなど、複雑な判定が必要な用途には、このイベントの利用が適切である。

Googel Cloud Platformで使う`gcloud`コマンドには、引数`--project`にGCPプロジェクト名を設定することでそのプロジェクトのリソースにアクセスできる。
筆者の場合は、開発環境、QA環境、本番環境で異なるGCPプロジェクトを使用しており、場合によって切り替える必要がある。
この引数を追加することが面倒であるため、環境変数`GCLOUD_PROJECT`に追加したならば、常にそのプロジェクト名を`--project`の引数に指定する。
また、"--project"引数を指定している場合には、この引数の追加を行わない。

これを実装した例を以下に示す。

```python
# `@events.on_transform_command`のデコレータをつけて関数を定義することで、
# コマンド実行時に毎回呼び出されるようにする。
@events.on_transform_command
def add_gcloud_project(cmd:str) -> str:

    # 最初に実行しようとしているコマンドを判定し、
    # 対象でない場合、何もしない。
    if not cmd.startswith("gcloud "):
        return cmd

    # コマンドの文字列に引数が含まれているか判定し、
    # 引数が含まれている場合、何もしない。
    if " --project" in cmd:
        return cmd

    # 環境変数`GCLOUD_PROJECT`が指定されているか判定し、
    # ない場合固定値のプロジェクト名を指定する。
    if "GCLOUD_PROJECT" in __xonsh__.env:
        project = __xonsh__.env["GCLOUD_PROJECT"]
    else:
        project = "nnyn-sundbox-gcp"

    # コマンドの文字列を引数を追加するように編集する。
    return cmd.replace("gcloud ", f"gcloud --project={project}")
```

<div class="page"/>

# 10. xontrib

## 10.1. xontribを使う

xonshの拡張パッケージを、xontribという。
xonshはxontribパッケージのリストを持っており、`xontrib list`で表示することができる。

```
>>> xontrib list
apt_tabcomplete     not-installed  not-loaded
autojump            not-installed  not-loaded
autoxsh             installed      not-loaded
```

各xontribを有効化するには`.xonshrc`に以下を追加する。

```
xontrib load direnv
```

xontribがインストールされていない状態で、このコマンドを入力するとインストール方法が表示される。
xontribパッケージの多くは、PyPIパッケージとして提供され、PyPIに登録されている事が多い。

また、`xontrib list`に表示されないxontribであっても、xpipコマンドでインストールし`xontrib <package>`を指定すれば読み込ませることができる。

xontribの一覧は、以下のページで公開されている。

https://xon.sh/xontribs.html

筆者はxonshでdirenvを利用するxonsh-direnvを公開しており、以下のコマンドでインストールと利用が可能である。

```
>>> xpip install xonsh-direnv
```

```
# .xonshrc
xontrib load direnv
```

## 10.2. xontribパッケージを作る

xontribの実装自体は、loadされた時に実行されるxonsh Scriptを用意するだけのため、非常に手軽に作ることができる。

xonsh-direnvの実装は以下のみである。

```python
import json

def __direnv():
    r = !(direnv export json)
    r.end()
    if len(r.output) > 0:
        lines = json.loads(r.output)
        for k,v in lines.items():
            if v is None:
                del(__xonsh__.env[k])
            else:
                __xonsh__.env[k] = v

@events.on_post_rc
def __direnv_chdir() -> None:
    __direnv()

@events.on_postcommand
def __direnv_postcommand(cmd: str, rtn: int, out: str or None, ts: list) -> None:
    __direnv()
```

コード: https://github.com/74th/xonsh-direnv/blob/master/xontrib/direnv.xsh

起動時とコマンド終了時に発生するイベントで、目的の機能の関数を実行されるようにしている。

あとは、PyPIパッケージになるように構築すれば良い。
PyPIパッケージの構築方法、公開方法は以下を参照してほしい。

https://packaging.python.org/tutorials/packaging-projects/

自作のxontribを`xontrib list`で表示できるようにするには、xonshのリポジトリにPRを送る必要がある。

https://github.com/xonsh/xonsh/blob/master/xonsh/xontribs.json

<div class="page"/>

# あとがき xonsh への思い

fish Shellはカスタマイズしなくていいほど便利だが、やはり自分用のShellをカスタマイズしたい気持ちは抑えきれなかった。
Shellの高度なカスタマイズのためにはzshをマスターするのが王道だが、その道が険しそうに思えた。
ならば Golang でShell兼タスクランナーを作るか(しかし、evalの実装が大変そうだった)、JS(TS)でなら、あるいはPythonならできないかを検討していたときに、Pythonタスクランナーである Fabric(Invoke) に出会った。
それは、Shell Scriptを、Pythonによる構造化で管理でき、しかし複雑すぎないとてもちょうど良いプロダクトだと思った。
また、さらにPythonでShellの役割を行うプロダクトを探していて、その中で見つけたのがxonshだった。
xonshはShellとして十分な機能を持ちながら、あくまでPythonの上位互換であることを守る素敵なShellである。
独自のキーバインドやプロンプトを組んでみたところ、とても快く使うことができた。
他にもgit statusの表示を独自のものにしたり、引数を自動で追加したり、プロンプトにkubernetesの情報を増やしたり。
Shellのカスタマイズが手軽にできることは、もはやエンジニアとして当たり前の権利のように感じる。
ぜひ本書を使って、ShellScriptの魔の手から逃れ、Python2を振り切って、Python3で幸せなエンジニアライフを目指してほしい。

# 書いた人

<img src="me.jpg" width="10%">

74th (Atsushi Morimoto)

Kubernetes、Python、VSCodeでごはん食べてる<br/>
twitter, github: @74th

* 『Visual Studio Codeデバッグ技術』インプレスR&D 2018
* 『Shell Scriptの代わりにPythonタスクランナーFabric&Invokeを活用する技術』 技術書典5 2018
* 『構造化と性能の間をGolangで攻める技術+WebWorker活用技術』 こばたく共著 技術書典4 2018
* 『Visual Studio Codeデバッグ技術』 技術書典3 2017
* Booth https://74th.booth.pm/

<div class="page"/>


<br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/>

#

Customizing Python Shell xonsh

* 2019年4月14日 技術書典6 初版
* 著者 74th (Atsushi Morimoto)

#

</div>
