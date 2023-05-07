import { ClubGameOpenUI } from './ClubGameOpenUI';
import { ClubFastJoinUI } from './ClubFastJoinUI';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { GAME_NAME } from './../../../data/GameConstValue';
const { ccclass, property } = cc._decorator;

@ccclass
export class ClubFastJoinGameItem extends cc.Component {
    private idx = -1
    private gameId = 0
    private collectGameList = null

    @property({type:[cc.SpriteFrame]})
    scArg:Array<cc.SpriteFrame> = []
    setInfo(idx, gameId, collectGameList)
    {
        this.idx = idx
        this.gameId = gameId
        this.collectGameList = collectGameList
        if (gameId == -1)
        {
            this.node.getChildByName("btn_sc").active = false;
            this.node.getChildByName("label_name").getComponent(cc.Label).string = "全 部"
            this.node.getChildByName("label_name_unselect").getComponent(cc.Label).string = "全 部"
        }
        else
        {
            this.node.getChildByName("btn_sc").active = true;
            this.node.getChildByName("label_name").getComponent(cc.Label).string = GAME_NAME[gameId]
            this.node.getChildByName("label_name_unselect").getComponent(cc.Label).string = GAME_NAME[gameId]
            if (collectGameList && collectGameList.indexOf(gameId) >= 0)
                this.node.getChildByName("btn_sc").getComponent(cc.Sprite).spriteFrame = this.scArg[0]
            else
                this.node.getChildByName("btn_sc").getComponent(cc.Sprite).spriteFrame = this.scArg[1]
        }
        if (UIManager.getInstance().getUI(ClubGameOpenUI))
            this.node.getChildByName("btn_sc").active = false;
    }

    setSelect(bSelect)
    {
        this.node.getChildByName("select_bg").active = bSelect
        this.node.getChildByName("label_name").active = bSelect
        this.node.getChildByName("label_name_unselect").active = !bSelect
        this.node.getChildByName("select_bg_unselect").active = !bSelect
    }

    updateCollect(){
        if (this.collectGameList && this.collectGameList.indexOf(this.gameId) >= 0)
            this.node.getChildByName("btn_sc").getComponent(cc.Sprite).spriteFrame = this.scArg[0]
        else
            this.node.getChildByName("btn_sc").getComponent(cc.Sprite).spriteFrame = this.scArg[1]
    }

    getGameType()
    {
        return this.gameId
    }

    btn_click()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (UIManager.getInstance().getUI(ClubFastJoinUI))
            UIManager.getInstance().getUI(ClubFastJoinUI).getComponent("ClubFastJoinUI").selectGameItem(this.idx);
        if (UIManager.getInstance().getUI(ClubGameOpenUI))
            UIManager.getInstance().getUI(ClubGameOpenUI).getComponent("ClubGameOpenUI").selectGameItem(this.idx);
    }

    btn_sc(){
        AudioManager.getInstance().playSFX("button_click");
        if (this.gameId == -1)
            return;
        if (!this.collectGameList)
            this.collectGameList = []
        var idx = this.collectGameList.indexOf(this.gameId)
        if (idx>=0)
            this.collectGameList.splice(idx, 1)
        else
            this.collectGameList.push(this.gameId)
        cc.sys.localStorage.setItem("collectFastList", JSON.stringify(this.collectGameList))
        this.updateCollect()
    }

}
