//LabelOverwrite
const {ccclass, property, inspector} = cc._decorator;

@ccclass
@inspector('packages://inspector/inspectors/comps/label.js')
export class CLabelOverWrite extends cc.Label {
    
    _updateNodeSize() {
        let pt:any = cc.Label.prototype;
        pt._updateNodeSize.call(this);
        this.node.emit("updateNodeSize");
    }

    onEnable() {
        let pt:any = cc.Label.prototype;
        pt.onEnable.call(this);
        this.node.emit("onEnable");
    }

    onDisable() {
        let pt:any = cc.Label.prototype;
        pt.onDisable.call(this);
        this.node.emit("onDisable");
    }
}