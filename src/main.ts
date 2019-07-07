import * as process from "process"
import * as path from "path"


let settings_yaml: string;
if (process.argv.length > 2) {
    settings_yaml = process.argv[2];
} else {
    settings_yaml = path.join("./", "settings.yaml");
}
