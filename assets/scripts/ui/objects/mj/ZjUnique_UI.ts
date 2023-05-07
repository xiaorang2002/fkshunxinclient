import { Utils } from './../../../../framework/Utils/Utils';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { GameDataManager } from '../../../../framework/Manager/GameDataManager';

const { ccclass, property } = cc._decorator;
// 捉鸡的翻牌阶段
@ccclass
export default class ZjUnique_UI extends BaseUI {

    public step = 0
    private _tile = 0
    protected static className = "ZjUnique_UI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_MJ_DIR + this.className;
    }

    onLoad() {
        
    }

    start() {
        this.loadZjMj()
        this.startZj(5)
    }

    private loadZjMj()
    {
        var data = GameDataManager.getInstance().getDataByCurGameType()
        var chickData = data.curGameOverData.chickInfo
        
    }

    // 开始捉鸡
    startZj(tile)
    {
        this.step = 1
        this._tile = tile
        var titleNode = this.node.getChildByName("zj")
        let action = cc.fadeIn(0.3);
        titleNode.runAction(action);

        var actionNode = this.node.getChildByName("mj_zj")
        Utils.loadTextureFromLocal(actionNode.getComponent(cc.Sprite), "/card_mj/mj_pg_2_b",
        function () { Utils.loadTextureFromLocal(actionNode.getChildByName("sp").getComponent(cc.Sprite), "", function () { actionNode.active = true; this.nextStep()}.bind(this)); }.bind(this));
    }

    nextStep()
    {
        if (this.step == 1)
        {

            var actionNode = this.node.getChildByName("mj_zj")
            var action1 = cc.rotateTo(1, 360)
            var action2 = cc.moveBy(0.5,cc.v2(actionNode.position.x, actionNode.position.y+40));
            var action3 = cc.moveBy(0.5,cc.v2(actionNode.position.x, actionNode.position.y-40));
            var func = cc.callFunc(function (target) {
                Utils.loadTextureFromLocal(actionNode.getComponent(cc.Sprite), "/card_mj/mj_pg_2",
                function () { Utils.loadTextureFromLocal(actionNode.getChildByName("sp").getComponent(cc.Sprite), "/card_mj/mj_" + this._tile, function () { this.nextStep += 1; this.nextStep()}.bind(this)); }.bind(this));
                
            }, this);
            let seq = cc.sequence(action2, action3, func);
            var finalAction = cc.spawn(action1, seq)
            actionNode.runAction(finalAction)
        }

        else if (this.step == 2)
        {
            
        }

    }

}