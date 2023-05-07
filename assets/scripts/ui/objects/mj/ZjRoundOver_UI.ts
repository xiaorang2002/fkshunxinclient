import { Utils } from '../../../../framework/Utils/Utils';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import { ThirdSelectUI } from "../../ThirdSelectUI";
import ZjScoreDetailPage_UI from './ZjScoreDetailPage_UI';

const { ccclass, property } = cc._decorator;

@ccclass
export default class ZjRoundOver_UI extends BaseUI {

    protected static className = "ZjRoundOver_UI";
    @property(cc.SpriteFrame)
    spf_title_bg: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    spf_bg: cc.SpriteFrame[] = [];

    private _gameData = null;   
    private _islj = false       // 是否流局
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_MJ_DIR + this.className;
    }
    onLoad() {
        this.initLayer()
    }

    onShow() {
        this.initLayer()
    }
    start() {

    }
    
    onDestroy() {
        super.onDestroy();
        this._gameData = null
    }

    /**初始化 */
    initLayer() {
        this._gameData = GameDataManager.getInstance().getDataByCurGameType()
        var info = this._gameData.gameinfo.curRoundOverData;
        for (var seat = 0; seat < 4; ++seat)
            this.node.getChildByName("player"+seat).active = false
        var maxScore = 0;
        var tempMap = new Map()
        this._islj = true;
        for (var balanceInfo of info.playerBalance) {
            var roundScore = balanceInfo.roundScore
            if (balanceInfo.status == 1)
                {
                    tempMap.set(balanceInfo.chairId, balanceInfo.huTile)
                    var playerNode = this.node.getChildByName("player"+(balanceInfo.chairId-1))
                    playerNode.getChildByName("mj_hu").active = true
                    Utils.loadTextureFromLocal(playerNode.getChildByName("mj_hu").getChildByName("sp").getComponent(cc.Sprite),
                    "/card_mj/mj_" + balanceInfo.huTile);
                }
            if (!roundScore)
                roundScore = 0
            if (roundScore > maxScore)
                maxScore = roundScore;
            if (balanceInfo.chairId == this._gameData.overTempPlayerInfo.get(0).seat) {
                this.node.getChildByName("sp_title_defeat").active = (roundScore < 0);
                this.node.getChildByName("sp_title_win").active = (roundScore >= 0);

                if (roundScore >= 0) {

                    this.node.getChildByName("change_bg").getComponent(cc.Sprite).spriteFrame = this.spf_bg[0];
                    this.node.getChildByName("change_bg2").getComponent(cc.Sprite).spriteFrame = this.spf_bg[0];
                }
                else {
                    this.node.getChildByName("change_bg").getComponent(cc.Sprite).spriteFrame = this.spf_bg[1];
                    this.node.getChildByName("change_bg2").getComponent(cc.Sprite).spriteFrame = this.spf_bg[1];
                }

            }
            if (balanceInfo.isHu != 0)
                this._islj = false;
        }
        this.node.getChildByName("sp_title_liuju").active = this._islj;
        if (this._islj) {
            this.node.getChildByName("change_bg").getComponent(cc.Sprite).spriteFrame = this.spf_bg[1];
            this.node.getChildByName("change_bg2").getComponent(cc.Sprite).spriteFrame = this.spf_bg[1];
            this.node.getChildByName("sp_title_win").active = false;
            this.node.getChildByName("sp_title_defeat").active = false;
        }
        for (var index =0; index < info.players.length; index++) {
            if (info.players[index].shouPai.length + info.players[index].pbMingPai.length*3 == 14)
                this.removeCard(info.players[index].shouPai, tempMap.get(info.players[index].chairId))
            this.setMj(info.players[index].chairId, info.players[index].shouPai, info.players[index].pbMingPai);
            this.setBaseInfo(info.players[index].chairId)

        }
        this.node.active = true;
    }

    private removeCard(cardList, cardId)
    {
        for (var j = 0; j < cardList.length; ++j) {
            if (cardList[j] === cardId) {
                cardList.splice(j, 1);
                break;
            }
        }
    }


    private setBaseInfo(chairId)
    {   
        var realSeat = this._gameData.getRealSeatByRemoteSeat(chairId)
        var info = this._gameData.overTempPlayerInfo.get(realSeat)
        var playerNode = this.node.getChildByName("player"+(chairId-1))
        playerNode.active = true
        var labelId = playerNode.getChildByName("label_id").getComponent(cc.Label)
        var labelName = playerNode.getChildByName("label_name").getComponent(cc.Label)
        var nodeZhuang = playerNode.getChildByName("sp_zhuang")
        var spHead = playerNode.getChildByName("head_sp").getComponent(cc.Sprite)
        labelId.string = info.id;
        labelName.string = info.name
        nodeZhuang.active = this._gameData.gameinfo.dealerId == info.id
        Utils.loadTextureFromNet(spHead, info.headurl);
        if (info.id == GameDataManager.getInstance().userInfoData.userId) {
            labelId.node.color = new cc.Color(255, 249, 163, 255)
            labelId.node.getChildByName("label_title").color = new cc.Color(255, 249, 163, 255);
            labelName.node.color = new cc.Color(255, 249, 163, 255)
            if (this._islj) {
                playerNode.getChildByName("sp_item_win_bg").active = false;
                playerNode.getChildByName("sp_item_bg").active = true;
                return;
            }
            if (this.node.getChildByName("sp_title_win").active) {
                playerNode.getChildByName("sp_item_win_bg").active = true;
                playerNode.getChildByName("sp_item_bg").active = false;
            }
            else {
                playerNode.getChildByName("sp_item_win_bg").active = false;
                playerNode.getChildByName("sp_item_bg").active = true;
            }

        }
        else {
            labelId.node.color = new cc.Color(255, 255, 255, 255)
            labelId.node.getChildByName("label_title").color = new cc.Color(255, 255, 255, 255);
            labelName.node.color = new cc.Color(255, 255, 255, 255)
            playerNode.getChildByName("sp_item_win_bg").active = false;
            playerNode.getChildByName("sp_item_bg").active = false;
        }
    }

    private setMj(seat, handMj, pgArray)
    {
        //调整手牌位置
        seat -= 1
        var sortHandMj = handMj.sort(function (a, b) { return a - b })
        var hidenum = (4 - Math.floor(sortHandMj.length / 3)) * 3;
        var playerNode = this.node.getChildByName("player"+seat)
        var mjList = playerNode.getChildByName("in_mj").children
        for (var k = 0; k < 13; ++k) {
            let mjnode = mjList[k];
            if (k < hidenum)
                mjnode.active = false;
            else {
                Utils.loadTextureFromLocal(mjnode.getChildByName("sp").getComponent(cc.Sprite),
                    "/card_mj/mj_" + sortHandMj[k - hidenum], function () { mjnode.active = true; });
            }
        }

        var mjPgNodeList = playerNode.getChildByName("pg_mj").children
        for (var i = 0; i < 4; ++i) {
            if (i < pgArray.length) {
                mjPgNodeList[i].active = true;
                for (var j = 0; j < pgArray[i].length; ++j) {
                    if (j < 4) {
                        let pgnode = mjPgNodeList[i].getChildByName("mj_" + j);
                        if (pgArray[i][j] > 0)
                            Utils.loadTextureFromLocal(pgnode.getChildByName("sp").getComponent(cc.Sprite),
                                "/card_mj/mj_" + pgArray[i][j], function () { pgnode.active = true; });
                        else if (pgArray[i][j] == 0)
                            Utils.loadTextureFromLocal(pgnode.getComponent(cc.Sprite), "card_mj/mj_out_2_b",
                                function () { Utils.loadTextureFromLocal(pgnode.getChildByName("sp").getComponent(cc.Sprite), "", function () { pgnode.active = true; }); });
                        else
                            pgnode.active = false;
                    }
                }
            }
            else
                mjPgNodeList[i].active = false;
        }

    }

    //分享按钮
    share_button(event) {
        AudioManager.getInstance().playSFX("button_click")
        //分享按钮
        return
    }

    //继续游戏按钮
    continue_button() {
        UIManager.getInstance().closeUI(ZjRoundOver_UI)
        UIManager.getInstance().openUI(ZjScoreDetailPage_UI, 20,() => { 
            UIManager.getInstance().getUI(ZjScoreDetailPage_UI).getComponent("ZjScoreDetailPage_UI").commonInitView();})
    }
}
