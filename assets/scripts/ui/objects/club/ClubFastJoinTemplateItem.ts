import { GAME_TYPE } from './../../../data/GameConstValue';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { ClubFastJoinUI } from './ClubFastJoinUI';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
const { ccclass, property } = cc._decorator;

@ccclass
export class ClubFastJoinTemplateItem extends cc.Component {

    private idx = -1
    private templateId = 0
    private gameId = 0
    private playerNum = 0
    private round = 0
    private isGps = false

    @property(cc.Label)
    labelDesc: cc.Label = null;

    @property(cc.Label)
    labelRoomInfo: cc.Label = null;


    setInfo(idx, templateId)
    {
        try{
            this.idx = idx
            this.templateId = templateId
            var clubData = GameDataManager.getInstance().clubData
            var templateInfo = clubData.getTemplateInfoById(templateId)
            this.gameId = templateInfo.template.gameId
            this.getPlayerNum(templateInfo.template.rule)
            this.labelDesc.string = templateInfo.template.description
            this.labelRoomInfo.string = this.playerNum+"人/"+this.round+"局"
        }
        catch (e)
        {
            this.labelDesc.string = "找不到桌子"
        }
    }

    getPlayerNum(rule)
    {
        var oRule = JSON.parse(rule)
        var jushu = [4,8,16]
        if (this.gameId == GAME_TYPE.MHXL) {
            jushu = [8, 16];
            var temp = [4,3,2]
            this.playerNum = temp[oRule.room.player_count_option];
            this.round = jushu[oRule.round.option];
        }
        else if (this.gameId == GAME_TYPE.LFMJ) {
            jushu = [8, 16];
            var temp = [3,2]
            this.playerNum = temp[oRule.room.player_count_option];
        }
        else if (this.gameId == GAME_TYPE.XZMJ)
        {
            jushu = [4, 8,16];
            this.playerNum = 4
        }
        else if (this.gameId == GAME_TYPE.PDK)
        {
            jushu = [8, 12, 20];
            this.playerNum = 3
        }
        else if (this.gameId == GAME_TYPE.LRPDK)
        {
            jushu = [8, 12, 20];
            this.playerNum = 2
        }
        else if (this.gameId == GAME_TYPE.DDZ)
        {
            jushu = [8, 12, 20];
            var temp = [3,2]
            this.playerNum = temp[oRule.room.player_count_option];
        }
        else if (this.gameId == GAME_TYPE.FR2F)
        {
            jushu = [4, 8, 16];
            this.playerNum =  4
        }
        else if (this.gameId == GAME_TYPE.SR2F)
        {
            jushu = [4, 8, 16];
            this.playerNum =  3
        }
        else if (this.gameId == GAME_TYPE.TR3F || this.gameId == GAME_TYPE.TR2F||this.gameId == GAME_TYPE.TR1F)
        {
            jushu = [4, 8, 16];
            this.playerNum = 2
        }
        else if (this.gameId == GAME_TYPE.SCPDK) {
            jushu = [8, 12, 20];
            var temp = [4,3,2]
            this.playerNum = temp[oRule.room.player_count_option];
        }
        else if (this.gameId == GAME_TYPE.ZJH || this.gameId == GAME_TYPE.NN) {
            jushu = [8, 12, 16, 20];
            var temp = [6,8]
            this.playerNum = temp[oRule.room.player_count_option];
        }
        else if (this.gameId == GAME_TYPE.YJMJ) {
            var temp = [4,3,2]
            this.playerNum = temp[oRule.room.player_count_option];
        }        
        else if (this.gameId == GAME_TYPE.ZGCP) {
            var temp = [3,2]
            this.playerNum = temp[oRule.room.player_count_option];
        }
        else if (this.gameId == GAME_TYPE.ZGMJ) {
            var temp = [3,2]
            jushu = [4,6,10,16];
            this.playerNum = temp[oRule.room.player_count_option];
        }
        this.round = jushu[oRule.round.option];
        this.isGps = oRule.option.gps_distance > 0
    }

    getRound() {

    }

    
    btn_click()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (UIManager.getInstance().getUI(ClubFastJoinUI))
            UIManager.getInstance().getUI(ClubFastJoinUI).getComponent("ClubFastJoinUI").fastJoin(this.gameId,this.templateId, this.isGps);
    }


}
