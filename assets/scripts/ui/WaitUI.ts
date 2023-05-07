import { BaseUI } from "../../framework/UI/BaseUI";
import { LogWrap } from "../../framework/Utils/LogWrap";
import * as GameConstValue from "../data/GameConstValue";
import { UIManager } from "../../framework/Manager/UIManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class WaitUI extends BaseUI {

    protected static className = "WaitUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_SYSTEM_DIR + this.className;
    }

    @property(cc.Node)
    nodeWait: cc.Node = null;

    onLoad() {
        //初始化位置
        //this.nodeWait.runAction(cc.repeatForever(cc.rotateBy(1, 360)));
    }

    // onShow() {
    //     let fn = function () {
    //         UIManager.getInstance().closeUI(WaitUI);
    //     }
    //     setTimeout(fn, 5000);
    // }

    // start() {
    //     let fn = function () {
    //         UIManager.getInstance().closeUI(WaitUI);
    //     }
    //     setTimeout(fn, 5000);
    // }

}
