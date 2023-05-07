import { BaseUI } from "../../framework/UI/BaseUI";
import { LogWrap } from "../../framework/Utils/LogWrap";
import * as GameConstValue from "../data/GameConstValue";
import { UIManager } from "../../framework/Manager/UIManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class TimeOutUI extends BaseUI {

    protected static className = "TimeOutUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_SYSTEM_DIR + this.className;
    }

    @property(cc.Node)
    nodeWait: cc.Node = null;

    onLoad() {
        //初始化位置
        // let action1 = cc.rotateBy(1, 360);
        // let action2 = cc.rotateBy(1, 360);
        // let action3 = cc.rotateBy(1, 360);
        // var action4 = cc.callFunc(function () {
        //     UIManager.getInstance().closeUI(TimeOutUI);
        // })
        // let seq = cc.sequence(action1, action2, action3, action4);
        // this.nodeWait.runAction(seq);
        this.nodeWait.runAction(cc.repeatForever(cc.rotateBy(1, 360)));

    }3
}