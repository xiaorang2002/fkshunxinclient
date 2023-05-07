import { GameDataManager } from './../../framework/Manager/GameDataManager';
import { GAME_TYPE } from './../data/GameConstValue';
const { ccclass, property } = cc._decorator;

@ccclass
export class GameUI_JF_Item extends cc.Component {

    public setInfo(idx, info) {
        var detail = JSON.parse(info.log)
        this.node.getChildByName("round").getComponent(cc.Label).string = "第" + detail.cur_round + "局";
        var chariId = 1
        var gameType = GameDataManager.getInstance().curGameType
        for(var balanceInfo of detail.players)
        {
            if (gameType == GAME_TYPE.PDK || gameType == GAME_TYPE.LRPDK || gameType == GAME_TYPE.SCPDK || gameType == GAME_TYPE.DDZ)
                this.node.getChildByName("score"+chariId).getComponent(cc.Label).string = (balanceInfo.round_money/100).toString()
            else
                this.node.getChildByName("score"+chariId).getComponent(cc.Label).string = (balanceInfo.win_money/100).toString()
            chariId += 1
        }
        // this.node.getChildByName("label_id").getComponent(cc.Label).string = info.guid;
    }

    public setAll(data,num){
        let totalScore = [0,0,0,0];
        if (data.length != 0)
        {
            for(let i=0;i<data.length;i++){
                let detail = JSON.parse(data[i].log)
                for(let j=0;j<detail.players.length;j++)
                {
                    totalScore[j] += detail.players[j].score
                }
            }
            for(let k=0;k<num;k++)
            {
                this.node.getChildByName("score"+(k+1)).getComponent(cc.Label).string = totalScore[k].toString()
            }
        }
        else
        {
            for(var i = 0; i <num;i++)
                this.node.getChildByName("score"+(i+1)).getComponent(cc.Label).string = "0"
        }

        this.node.getChildByName("round").getComponent(cc.Label).string = "总计"
        
    }


}
