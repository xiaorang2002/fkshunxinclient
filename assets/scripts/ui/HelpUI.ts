import { UIManager } from './../../framework/Manager/UIManager';
import { AudioManager } from './../../framework/Manager/AudioManager';
import { GAME_TYPE } from './../data/GameConstValue';
import * as GameConstValue from "../data/GameConstValue";
import { BaseUI } from "../../framework/UI/BaseUI";

const { ccclass, property } = cc._decorator;

@ccclass
export class HelpUI extends BaseUI {

    protected static className = "HelpUI";
    public static getUrl(): string {
        return GameConstValue.ConstValue.UI_SYSTEM_DIR + this.className;
    }
    @property(cc.Prefab)
    itemPrefab: cc.Prefab = null;
    @property([cc.SpriteFrame])
    spfContent: cc.SpriteFrame[] = [];
    @property(cc.Sprite)
    nodeContent: cc.Sprite = null;

    private gameIdx: number = -1;       //当前游戏类型
    private nodeItemList = []



    public setGameTypeData() {
        this.updateButtonSelect(200)
        this.updateContent()
    }

    public selectGameItem(idx) {
        if (idx == this.gameIdx)
            return
        this.nodeItemList[this.gameIdx].getComponent('RuleUI_Item').setSelect(false);
        this.nodeItemList[idx].getComponent('RuleUI_Item').setSelect(true);
        this.gameIdx = idx
        this.node.getChildByName("help_content").getComponent(cc.ScrollView).stopAutoScroll()
        this.updateContent()
    }

    private updateButtonSelect(type) {
        if (this.gameIdx >= 0) {
            this.node.getChildByName("btn_" + this.gameIdx).getChildByName("select_bg").active = false
            this.node.getChildByName("btn_" + this.gameIdx).getChildByName("label_name").active = false
            this.node.getChildByName("btn_" + this.gameIdx).getChildByName("label_name_unselect").active = true
            this.node.getChildByName("btn_" + this.gameIdx).getChildByName("select_bg_unselect").active = true
        }
        this.gameIdx = type
        this.node.getChildByName("btn_" + type).getChildByName("select_bg").active = true
        this.node.getChildByName("btn_" + type).getChildByName("label_name").active = true
        this.node.getChildByName("btn_" + type).getChildByName("label_name_unselect").active = false
        this.node.getChildByName("btn_" + type).getChildByName("select_bg_unselect").active = false

    }

    private updateContent() {
        var spfIdx = 0
        if (this.gameIdx == GAME_TYPE.XZMJ)
            spfIdx = 0
        else if (this.gameIdx == GAME_TYPE.LRPDK)
            spfIdx = 1
        else if (this.gameIdx == GAME_TYPE.PDK)
            spfIdx = 2
        else if (this.gameIdx == GAME_TYPE.DDZ)
            spfIdx = 3
        else if (this.gameIdx == GAME_TYPE.ZGMJ)
            spfIdx = 4
        else if (this.gameIdx == GAME_TYPE.ZGCP)
            spfIdx = 5
        this.nodeContent.spriteFrame = this.spfContent[spfIdx]
    }


    btn_game_select(event, CustomEvent) {
        var gameType = parseInt(CustomEvent)
        if (this.gameIdx == gameType)
            return
        this.updateButtonSelect(gameType)
        this.updateContent()
    }


    btn_close() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(HelpUI);
    }

}
