import { Utils } from "../Utils/Utils";
import { ListenerType } from "../../scripts/data/ListenerType";
import { ListenerManager } from "../../framework/Manager/ListenerManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class BgScaler extends cc.Component {

    @property
    mode: Number = 0;

    // LIFE-CYCLE CALLBACKS:
    private originWidth: number = 0;
    private originHeight: number = 0;

    onLoad() {
        this.originWidth = this.node.width;
        this.originHeight = this.node.height;
        this.resize();
        ListenerManager.getInstance().add(ListenerType.sizeChange, this, this.resize);

    }

    // start() {
    // }

    setMode(mode) {
        this.mode = mode;
        this.resize();
    }

    // LIFE-CYCLE CALLBACKS:
    resize() {
        if (!Utils.curDR) {
            return;
        }
        this.node.width = this.originWidth;
        this.node.height = this.originHeight;

        //0、居中（居中其实不需要挂这个脚本，浪费效率）
        //1、宽高都根据高度拉伸(自由缩放)
        //2、长边充满（裁减）
        var cvs = cc.find('Canvas').getComponent(cc.Canvas);
        var size = cc.view.getFrameSize();

        var dr = Utils.curDR;
        var scaleMethod = this.mode;

        //
        var fitWidth = true;
        //如果更宽，则使用定高
        if ((size.width / size.height) > (dr.width / dr.height)) {
            fitWidth = false;
        }

        //自由缩放撑满
        if (scaleMethod == 1) {
            if (fitWidth) {
                this.node.height = this.node.width / size.width * size.height;
            }
            else {
                this.node.width = this.node.height / size.height * size.width;
            }
        }
        //保持等比缩放撑满
        else if (scaleMethod == 2) {
            if (fitWidth) {
                //定宽表示设备更高了，则以高的缩放为准
                var oldHeight = this.node.height;
                this.node.height = this.node.width / size.width * size.height;
                var scale = this.node.height / oldHeight;
                this.node.width = scale * this.node.width;
            }
            else {
                //定高表示设备更宽的，以宽的缩放为准
                var oldWidth = this.node.width;
                this.node.width = this.node.height / size.height * size.width;
                var scale = this.node.width / oldWidth;
                this.node.height = scale * this.node.height;
            }
        }
        else {
            //默认处理，有黑边
        }
        var isIphone = Utils.isPhoneX()
        if(isIphone>0)
        {
            var offset = {1:50,2:60,3:60,4:60}
            this.node.width = this.node.width-offset[isIphone]
            this.node.position = cc.v3(offset[isIphone]/2,0)
        }
    }
    // update (dt) {}
}
