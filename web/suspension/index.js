import suspension from "./suspension"
const plugin = {
    install(vue){
        vue.directive("suspension", suspension);
    }
}
export default plugin
export const install = plugin.install;