//LabelShadow
import { CLabelOverWrite } from "./LabelOverWrite";

const { ccclass, property, requireComponent } = cc._decorator;

@ccclass
@requireComponent(CLabelOverWrite)
export class CLabelShadow extends cc.Component {
    @property({
        tooltip: "描边颜色"
    })
    private shadowColor: cc.Color = cc.color(0, 0, 0, 255);

    @property({
        tooltip: "偏移量"
    })
    private shadowOffset: cc.Vec3 = cc.v3(0, -4);

    /** 阴影文字 */
    private shadeLabel: cc.Label = null;

    /** 设置阴影颜色 */
    setColor(color: cc.Color) {
        this.shadowColor = color;
        this.refreshShadow();
    }
    /** 设置阴影偏移量 */
    setOffset(offset: cc.Vec3) {
        this.shadowOffset = offset;
        this.refreshShadow();
    }

    /** 更新阴影 */
    private refreshShadow() {
        if (CC_JSB) {
            let label: any = this.node.getComponent(cc.Label);
            if (label) {
                label._sgNode.enableShadow( this.shadowColor, cc.size(this.shadowOffset.x,this.shadowOffset.y));
            }
        } else if (this.shadeLabel) {
            this.shadeLabel.node.color = this.shadowColor;
            this.shadeLabel.node.position = this.shadowOffset;
        }
    }

    onLoad() {
        this.node.on("updateNodeSize", () => {
            this.onLabelChange();
        });
        this.node.on("onEnable", () => {
            if (this.shadeLabel) {
                this.shadeLabel.node.active = true;
            }
        });
        this.node.on("onDisable", () => {
            if (this.shadeLabel) {
                this.shadeLabel.node.active = false;
            }
        });
    }

    onEnable() {
        let label: any = this.node.getComponent(cc.Label);
        if (label) {
            if (CC_JSB) {
                label._sgNode.enableShadow(this.shadowOffset, cc.size(this.shadowOffset.x,this.shadowOffset.y) );
            } else {
                if (this.shadeLabel) {
                    this.shadeLabel.node.active = true;
                } else {
                    let node = new cc.Node();
                    this.shadeLabel = node.addComponent(cc.Label);
                    this.shadeLabel.node.on("onDestroy", () => { this.destroy(); })
                    this.node.addChild(node, -8, "LabelShadow");
                    this.onLabelChange();
                    this.refreshShadow();
                }
            }
        }
}

onDisable() {
    if (this.shadeLabel) {
        this.shadeLabel.node.active = false;
    }
}

/** 刷新阴影数据 */
private onLabelChange() {
    if (CC_JSB) {
        return;
    }

    let label: any = this.node.getComponent(cc.Label);
    if (label && this.shadeLabel) {
        this.shadeLabel.string = label.string;
        this.shadeLabel.horizontalAlign = label.horizontalAlign;
        this.shadeLabel.verticalAlign = label.verticalAlign;
        this.shadeLabel.fontSize = label.fontSize;
        this.shadeLabel.fontFamily = label.fontFamily;
        this.shadeLabel.lineHeight = label.lineHeight;
        this.shadeLabel.overflow = label.overflow;
        this.shadeLabel.enableWrapText = label.enableWrapText;
        this.shadeLabel.font = label.font;
    }
}
}