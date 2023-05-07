import { Utils } from './../../../../framework/Utils/Utils';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
const { ccclass, property } = cc._decorator;

@ccclass
export class ClubMessageItem extends cc.Component {

    @property(cc.Sprite)
    spHead: cc.Sprite = null;
    @property(cc.Label)
    labelId: cc.Label = null;
    @property(cc.Label)
    labelName: cc.Label = null;

    initView(info, type)
    {
        if(type == "huopai")
        {
            var tagetNode = this.node.getChildByName("node_huopai")
            tagetNode.active = true;
            var labelDesc = tagetNode.getChildByName("label_desc").getComponent(cc.Label);
            var labelType = tagetNode.getChildByName("label_type").getComponent(cc.Label);
            var labelNum = tagetNode.getChildByName("label_num").getComponent(cc.Label);
            if(info.type == 1)
                labelDesc.string = "【"+info.guid+"】和"+"【"+ info.guid_other +"】"
            else
                labelDesc.string = "【"+info.guid+"】对"+"【"+ info.guid_other +"】"

            if (info.type == 1)
                labelType.string = "同桌（小局）"
            else if (info.type == 2)
                labelType.string = "胡牌"
            else
                labelType.string = "碰杠"
            labelNum.string = info.nums
            return
        }
        
        var tagetNode = this.node.getChildByName("node_message")
        tagetNode.active = true;
        var clubType = "联盟"
        var clubData = GameDataManager.getInstance().clubData
        if(clubData && clubData.clubType == 0)
            clubType = "亲友群"
        if (info.playerinfo)
        {
            tagetNode.getChildByName("label_event").active = false;
            tagetNode.getChildByName("sp_head").active = true;
            tagetNode.getChildByName("label_name").active = true;
            tagetNode.getChildByName("label_id").active = true;
            if(info.playerinfo.head_url && info.playerinfo.head_url != ""){
                Utils.loadTextureFromNet(this.spHead, info.playerinfo.head_url);
            }
            this.labelName.string = Utils.getShortName(info.playerinfo.nickname, 10);
            this.labelId.string = info.playerinfo.guid.toString();
        }
        else
        {
            tagetNode.getChildByName("label_event").active = true;
            tagetNode.getChildByName("sp_head").active = false;
            tagetNode.getChildByName("label_name").active = false;
            tagetNode.getChildByName("label_id").active = false;
            var des = "【ID："+info.content.guid+"】加入"+clubType
            if (info.type == 2)
                des = "【ID："+info.content.guid+"】被踢出"+clubType
            tagetNode.getChildByName("label_event").getComponent(cc.Label).string = des
        }
     
        tagetNode.getChildByName("label_time").getComponent(cc.Label).string = Utils.getTimeString(info.created_time*1000,"-",false); 
        tagetNode.getChildByName("label_oper").getComponent(cc.Label).string = "ID："+info.operator
    }
}
