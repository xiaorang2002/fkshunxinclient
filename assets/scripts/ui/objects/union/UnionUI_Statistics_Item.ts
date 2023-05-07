import { CLUB_POWER } from './../../../data/club/ClubData';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { UnionUI_Spread_Single } from './UnionUI_Spread_Single';
import { Utils } from './../../../../framework/Utils/Utils';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";


const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Statistics_Item extends cc.Component {


    @property(cc.Sprite)
    spHead: cc.Sprite = null;

    @property(cc.Sprite)
    spItem: cc.Sprite = null;

    @property(cc.Label)
    labelStatus: cc.Label = null;

    initView(info,type,selectPlayerId)
    {   
        this.node.getChildByName("label6").active = false;
        if (type == "gx")
        {
            this.node.getChildByName("node_head").active = true;
            this.node.getChildByName("label_player_id").active = true;
            this.node.getChildByName("label_player_name").active = true;
            this.node.getChildByName("label4").active = true;
            this.node.getChildByName("label5").active = true;
            this.node.getChildByName("label1").active = false;
            this.node.getChildByName("label2").active = false;
            this.setId(info.playerinfo.guid);
            this.setNameHead(info.playerinfo.head_url, info.playerinfo.nickname);
            if(info.playerinfo.guid != selectPlayerId)
                this.setRoleIcon(info.role)
            this.node.getChildByName("label4").getComponent(cc.Label).string = (info.commission/100).toString()
            this.node.getChildByName("label5").getComponent(cc.Label).string = Utils.formatDate(info.date,2)
        }
        else{
            this.node.getChildByName("node_head").active = false;
            this.node.getChildByName("label_player_id").active = false;
            this.node.getChildByName("label_player_name").active = false;
            this.node.getChildByName("label4").active = false;
            this.node.getChildByName("label5").active = false;
            this.node.getChildByName("label1").active = true;
            this.node.getChildByName("label2").active = true;
            var dataList = ["", ""]
            if(type == "sy")
            {
                dataList[0] = (info.money/100).toString()
                dataList[1] = Utils.formatDate(info.date,2)
            }
            else if (type == "js")
            {
                this.node.getChildByName("label6").active = true;
                dataList[0] = info.count.toString()
                dataList[1] = Utils.formatDate(info.date,2)
                if (info.valid_count)
                {
                    try{
                        this.node.getChildByName("label6").getComponent(cc.Label).string = info.valid_count.toFixed(2).toString()
                    }
                    catch (e){
                    }
                }
                else
                    this.node.getChildByName("label6").getComponent(cc.Label).string = "0"
            }
            else if (type == "yj")
            {
                dataList[0] = (info.comission/100).toString()
                dataList[1] = Utils.formatDate(info.date,2)
            }
            else if (type == "xh")
            {
                dataList[0] = (info.amount/100).toString()
                dataList[1] = Utils.formatDate(info.date,2)
            }
            this.node.getChildByName("label1").getComponent(cc.Label).string = dataList[0]
            this.node.getChildByName("label2").getComponent(cc.Label).string = dataList[1]
        }
        
    }

    //设置id
    public setId(pid: number) {
        this.node.getChildByName("label_player_id").getComponent(cc.Label).string = pid.toString()
    }

    //设置头像
    public setNameHead(headurl: string, name: string) {
        if(headurl && headurl != ""){
            Utils.loadTextureFromNet(this.spHead, headurl);
        }
        this.node.getChildByName("label_player_name").getComponent(cc.Label).string = Utils.getShortName(name);
    }
    
    setRoleIcon(type)
    {
        this.spItem.node.active = true;
        if (type == CLUB_POWER.CRT_BOSS)
            this.labelStatus.string = "盟 主"
        else if (type == CLUB_POWER.CRT_PRATNER) // 合伙人
            this.labelStatus.string = "合伙人"
        else if (type == CLUB_POWER.CRT_ADMIN)
            this.labelStatus.string = "管理员"
        else
            this.spItem.node.active = false;
    }

}
