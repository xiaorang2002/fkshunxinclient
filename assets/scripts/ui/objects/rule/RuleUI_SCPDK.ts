import { ListenerType } from './../../../data/ListenerType';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseRuleUI } from "./BaseRuleUI";
import { MessageManager } from "../../../../framework/Manager/MessageManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class RuleUI_PDK extends BaseRuleUI {
    protected static className = "RuleUI_PDK";


    private gpsList = [100,300,500,1000]

    private ruleInfo = {
        ju_shu: 0, // 局数下标
        ren: [true, false, false],  // 四人局 三人局 二人局
        sc: [true, false], // 黑五先出，赢家先出
        sc1:[false],// 首出必带黑桃五
        zf: [true, false, false],  // AA支付 老板支付 房主支付
        wf1:[true, false, false],
        wf2:[true, false],
        wf3:[true, false],
        wf4:[false, false,false, false,false, false, true, false, false],
        gn: [false, false, true, false, true, true],// ip防作弊 gps防作弊 手动准备 禁止互动
        zbcs: [true,false, false, false, false], // 10  15 30 60 90
        tg1: [true, false, false, false], // 不托管，30秒，60秒，120秒
        tg2: [true, false, false, false, false],
        gps_distance: -1,
    }
    @property(cc.Label)
    gps_str: cc.Label = null;

    //局数
    @property([cc.Toggle])
    toggle_jushu: cc.Toggle[] = [];

    //局数
    @property([cc.Toggle])
    toggle_ren: cc.Toggle[] = [];

    //首出
    @property([cc.Toggle])
    toggle_sc: cc.Toggle[] = [];

    //首出
    @property([cc.Toggle])
    toggle_sc1: cc.Toggle[] = [];

    //支付
    @property([cc.Toggle])
    toggle_zf: cc.Toggle[] = [];

    //玩法1
    @property([cc.Toggle])
    toggle_wf1: cc.Toggle[] = [];

    //玩法2
    @property([cc.Toggle])
    toggle_wf2: cc.Toggle[] = [];
    
    //玩法3
    @property([cc.Toggle])
    toggle_wf3: cc.Toggle[] = [];

    //玩法4
    @property([cc.Toggle])
    toggle_wf4: cc.Toggle[] = [];
    
    //功能
    @property([cc.Toggle])
    toggle_gn: cc.Toggle[] = [];

    //托管1
    @property([cc.Toggle])
    toggle_tg_1: cc.Toggle[] = [];

    //托管2
    @property([cc.Toggle])
    toggle_tg_2: cc.Toggle[] = [];

    //准备超时
    @property([cc.Toggle])
    toggle_zbcs: cc.Toggle[] = [];
    
    start()
    {

    }

    public initRule(ruleInfo: any = null) {
        this.isInit = true;
        this.initRuleInfoByData(ruleInfo)
        this.updateView();
        MessageManager.getInstance().messagePost(ListenerType.ruleCostChanged);
    }

    private initRuleInfoByData(ruleInfo)
    {
        if (ruleInfo)
        {
            var oRule = ruleInfo
            this.ruleInfo.ju_shu = oRule.round.option
            this.ruleInfo.sc[0] = oRule.play.zhuang.normal_round == 2
            this.ruleInfo.sc[1] = oRule.play.zhuang.normal_round == 0
            if(oRule.play.first_discard && oRule.play.first_discard.with_5 == true)
                this.ruleInfo.sc1[0] = true
            this.ruleInfo.ren[0] = false
            this.ruleInfo.ren[oRule.room.player_count_option] = true
            this.ruleInfo.wf1[0] = false
            this.ruleInfo.wf1[oRule.play.bomb_type_option] = true
            this.ruleInfo.wf2[0] = oRule.play.bomb_score[0] == 5
            this.ruleInfo.wf2[1] = oRule.play.bomb_score[0] == 10
            this.ruleInfo.wf3[0] = oRule.play.bomb_score[1] == 10
            this.ruleInfo.wf3[1] = oRule.play.bomb_score[1] == 20
            this.ruleInfo.wf4[0] = oRule.play.zha_niao
            this.ruleInfo.wf4[1] = oRule.play.lai_zi
            this.ruleInfo.wf4[2] = oRule.play.zi_mei_dui
            this.ruleInfo.wf4[3] = oRule.play.special_score == 10
            this.ruleInfo.wf4[4] = oRule.play.special_score == 20
            this.ruleInfo.wf4[5] = oRule.room.dismiss_all_agree
            if (oRule.play.fan_chun == false)
                this.ruleInfo.wf4[6] = false
            else
                this.ruleInfo.wf4[6] = true
            if(oRule.play.lastone_not_consume)
                this.ruleInfo.wf4[7] = true
            else
                this.ruleInfo.wf4[7] = false
            if(oRule.play.que_yi_se)
                this.ruleInfo.wf4[8] = true
            else
                this.ruleInfo.wf4[8] = false
            if (oRule.play.ready_timeout_option >= 0)
            {
                this.ruleInfo.zbcs[0] = false
                this.ruleInfo.zbcs[oRule.play.ready_timeout_option] = true
            }
            this.ruleInfo.gn[0] = oRule.option.ip_stop_cheat
            this.ruleInfo.gn[2] = oRule.option.hand_ready
            this.ruleInfo.gn[3] = oRule.option.block_hu_dong
            if(oRule.option.owner_kickout_player == false)
                this.ruleInfo.gn[4] = false
            else
                this.ruleInfo.gn[4] = true
            if (oRule.option.request_dismiss == false)
                this.ruleInfo.gn[5] = false
            else
                this.ruleInfo.gn[5] = true 
            if (oRule.trustee.second_opt >= 0)
            {
                this.ruleInfo.tg1[0] = false
                this.ruleInfo.tg1[oRule.trustee.second_opt+1] = true
            }
            if (oRule.room.auto_dismiss)
            {
                this.ruleInfo.tg2[0] = false
                this.ruleInfo.tg2[oRule.room.auto_dismiss.trustee_round] = true
            }
            if (oRule.option.gps_distance > 0){
                this.ruleInfo.gn[1] = true
                this.ruleInfo.gps_distance = oRule.option.gps_distance
            }
            
        }
        else
        {
            let save_rule_scpdk = cc.sys.localStorage.getItem("rule_scpdk");
            if (save_rule_scpdk != null) {
                var saveInfo = JSON.parse(save_rule_scpdk);
                saveInfo.zf = this.ruleInfo.zf
                saveInfo.sc1 = this.ruleInfo.sc1
                if (saveInfo.wf4.length != 7)
                    saveInfo.wf4[6] = true
                if (saveInfo.wf4.length != 9)
                {
                    saveInfo.wf4[7] = false
                    saveInfo.wf4[8] = false
                }
                this.ruleInfo = saveInfo
                cc.sys.localStorage.removeItem("rule_scpdk");
            }
        }
    }

    public setRuleType(type)
    {
        var clubData = GameDataManager.getInstance().clubData
        if (clubData != null)
        {
            this.ruleInfo.zf[1] = true
            this.ruleInfo.zf[0] = false
            this.toggle_zf[0].node.active = false
            this.toggle_zf[1].node.position = this.toggle_zf[0].node.position
        }
        if (type == 0){
            this.toggle_zf[1].node.active = false
            this.toggle_zf[2].node.active = true
            this.toggle_zf[0].node.active = false
            this.ruleInfo.zf[0] = false
            this.ruleInfo.zf[1] = false
            this.ruleInfo.zf[2] = true
            this.toggle_zf[2].node.position = this.toggle_zf[0].node.position
        }
        else{
            this.toggle_zf[2].node.active = false 
            this.toggle_zf[1].node.active = true
        }
        this.toggle_zf[this.ruleInfo.zf.indexOf(true)].check();
        this.ruleSelect(this.toggle_zf[this.ruleInfo.zf.indexOf(true)], true, false);
    }

    public updateView() {
        if (!this.ruleInfo.tg2)
        {
            this.ruleInfo.tg2 = [true, false, false, false, false]
        }
        if (this.ruleInfo.gn.length == 5)
        {
            this.ruleInfo.gn[5] = true
        }
        this.toggle_sc[this.ruleInfo.sc.indexOf(true)].check();
        this.ruleSelect(this.toggle_sc[this.ruleInfo.sc.indexOf(true)], true);
        
        if (this.ruleInfo.sc1[0] == true){
            this.toggle_sc1[0].check();
            this.ruleSelect(this.toggle_sc1[0], true);
            this.ruleInfo.sc1[0] = true
        }

        this.toggle_jushu[this.ruleInfo.ju_shu].check();
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu], true);

        this.toggle_ren[this.ruleInfo.ren.indexOf(true)].check();
        this.ruleSelect(this.toggle_ren[this.ruleInfo.ren.indexOf(true)], true);

        this.toggle_wf1[this.ruleInfo.wf1.indexOf(true)].check();
        this.ruleSelect(this.toggle_wf1[this.ruleInfo.wf1.indexOf(true)], true);

        this.toggle_wf2[this.ruleInfo.wf2.indexOf(true)].check();
        this.ruleSelect(this.toggle_wf2[this.ruleInfo.wf2.indexOf(true)], true);

        this.toggle_wf3[this.ruleInfo.wf3.indexOf(true)].check();
        this.ruleSelect(this.toggle_wf3[this.ruleInfo.wf3.indexOf(true)], true);
        for (let idx = 0;idx<this.ruleInfo.wf4.length;idx++)
        {  
            if (this.ruleInfo.wf4[idx]){
                this.toggle_wf4[idx].check();
                this.ruleSelect(this.toggle_wf4[idx], true);
                this.ruleInfo.wf4[idx] = true
            }
        }
        this.toggle_wf4[4].node.getChildByName("checkmark").active = this.ruleInfo.wf4[4];
        this.toggle_wf4[3].node.getChildByName("checkmark").active = this.ruleInfo.wf4[3];
        this.toggle_wf4[8].node.active = !this.ruleInfo.ren[0]
        for (let idx = 0;idx<this.ruleInfo.gn.length;idx++)
        {  
            if (this.ruleInfo.gn[idx]){
                this.toggle_gn[idx].check();
                this.ruleSelect(this.toggle_gn[idx], true);
                this.ruleInfo.gn[idx] = true
            }
        }
        if (!this.ruleInfo.zbcs)
            this.ruleInfo.zbcs = [true,false, false, false, false]
        this.toggle_zbcs[this.ruleInfo.zbcs.indexOf(true)].check();
        this.ruleSelect(this.toggle_zbcs[this.ruleInfo.zbcs.indexOf(true)], true);
        this.node.getChildByName("rule_tg2").active = this.ruleInfo.tg1.indexOf(true) != 0
        this.toggle_tg_1[this.ruleInfo.tg1.indexOf(true)].check();
        this.ruleSelect(this.toggle_tg_1[this.ruleInfo.tg1.indexOf(true)], true);
        this.toggle_tg_2[this.ruleInfo.tg2.indexOf(true)].check();
        this.ruleSelect(this.toggle_tg_2[this.ruleInfo.tg2.indexOf(true)], true);
        this.node.getChildByName("rule_tg2").active = this.ruleInfo.tg1.indexOf(true) != 0

        if (this.ruleInfo.gps_distance > 0)
            this.gps_str.string = this.ruleInfo.gps_distance.toString()
        else
            this.gps_str.string = "0"

        this.node.setContentSize(936, 1730);
        this.isInit = false;
        
    }

    public getRule()
    {
        var trustee = {}
        if (this.ruleInfo.tg1.indexOf(true) != 0)
            trustee = {second_opt:this.ruleInfo.tg1.indexOf(true)-1, type_opt:0}
        
        var room = null
        if (this.ruleInfo.tg1.indexOf(true) != 0)
        {
            trustee = {second_opt:this.ruleInfo.tg1.indexOf(true)-1, type_opt: 0}
            if (this.ruleInfo.tg2.indexOf(true) != 0)
                room = {player_count_option: this.ruleInfo.ren.indexOf(true), dismiss_all_agree: this.ruleInfo.wf4[5], auto_dismiss:{ trustee_round: this.ruleInfo.tg2.indexOf(true)}}
        }
        if (room == null)
            room = {player_count_option: this.ruleInfo.ren.indexOf(true), dismiss_all_agree: this.ruleInfo.wf4[5]}
        var gps  =this.ruleInfo.gps_distance
        if (!this.ruleInfo.gn[1])
            gps = -1
        var unique_type_score = 0
        if (this.ruleInfo.wf4[3])
            unique_type_score = 10
        else if (this.ruleInfo.wf4[4])
            unique_type_score = 20
        var bomb_3_score = 5
        if (this.ruleInfo.wf2[1])
            bomb_3_score = 10
        var bomb_4_score = 10
        if (this.ruleInfo.wf3[1])
            bomb_4_score = 20
        var normal_round = 0 // 0表示赢家先出
        var with_5 = this.ruleInfo.sc1[0]
        if (this.ruleInfo.sc.indexOf(true) == 0)
            normal_round = 2
        if (this.ruleInfo.sc.indexOf(true) == 1)
            with_5 = false

        var que_yi_se = this.ruleInfo.wf4[8]
        if (this.ruleInfo.ren[0])
            que_yi_se = false
        var rule = {
            round: {option:this.ruleInfo.ju_shu},
            pay: {money_type: 1, option: this.ruleInfo.zf.indexOf(true)+1},
            room: room,
            play: {
                first_discard:{with_5:with_5},
                zhuang:{normal_round:normal_round}, // first_round 2表示首轮黑桃三先出牌
                bomb_type_option:this.ruleInfo.wf1.indexOf(true),
                bomb_score:[bomb_3_score,bomb_4_score],
                zha_niao:this.ruleInfo.wf4[0],
                lai_zi:this.ruleInfo.wf4[1],
                zi_mei_dui:this.ruleInfo.wf4[2],
                special_score:unique_type_score,
                ready_timeout_option:this.ruleInfo.zbcs.indexOf(true),
                fan_chun:this.ruleInfo.wf4[6],
                lastone_not_consume:this.ruleInfo.wf4[7],
                que_yi_se:que_yi_se
            },
            option:{
                ip_stop_cheat: this.ruleInfo.gn[0],
                hand_ready:this.ruleInfo.gn[2],     
                block_hu_dong:this.ruleInfo.gn[3],     
                gps_distance:gps,
                owner_kickout_player: this.ruleInfo.gn[4],
                request_dismiss:this.ruleInfo.gn[5],            

            },
            trustee:trustee,
        }
        return rule
    }

    public getCostInfo()
    {   
        if (this.ruleInfo.ju_shu == 0)
            return 1
        else
            return 2
    }

    public saveRule()
    {
        cc.sys.localStorage.setItem("rule_scpdk", JSON.stringify(this.ruleInfo));

    }

    public setAllGrey()
    {
        return
    }

    public btn_gps_length(event, customEventData)
    {
        if (!this.ruleInfo.gn[1])
        {
            return
        }
        var type = parseInt(customEventData)
        var length = parseFloat(this.gps_str.string)
        var idx = this.gpsList.indexOf(length)
        if (type == 0) // 减
        {
            idx -= 1
            if (idx < 0)
                idx = 0
        }
        else // 加
        {
            idx += 1
            if (idx > this.gpsList.length - 1)
                idx = this.gpsList.length - 1
        }
        this.ruleInfo.gps_distance = this.gpsList[idx]
        this.gps_str.string = this.gpsList[idx].toString();

    }

    public btn_jushu(event, customEventData)
    {
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu], false);
        this.ruleInfo.ju_shu = parseInt(customEventData);
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu], true);
        MessageManager.getInstance().messagePost(ListenerType.ruleCostChanged);
    }

    public btn_ren(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.ren.indexOf(true)
        this.ruleSelect(this.toggle_ren[originSelectIndex], false);
        this.ruleInfo.ren[originSelectIndex] =false
        this.ruleInfo.ren[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_ren[parseInt(customEventData)], true);
        this.toggle_wf4[8].node.active = !this.ruleInfo.ren[0]
    }

    public btn_shouchu(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.sc.indexOf(true)
        this.ruleSelect(this.toggle_sc[originSelectIndex], false);
        this.ruleInfo.sc[originSelectIndex] =false
        this.ruleInfo.sc[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_sc[parseInt(customEventData)], true);
        this.toggle_sc1[0].node.active = this.ruleInfo.sc[0]
    }

    public btn_shouchu1(event, customEventData)
    {
        this.ruleInfo.sc1[parseInt(customEventData)] = !this.ruleInfo.sc1[parseInt(customEventData)]
        this.ruleSelect(this.toggle_sc1[parseInt(customEventData)], this.ruleInfo.sc1[parseInt(customEventData)]);
    }

    public btn_zhifu(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.zf.indexOf(true)
        this.ruleSelect(this.toggle_zf[originSelectIndex], false);
        this.ruleInfo.zf[originSelectIndex] =false
        this.ruleInfo.zf[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_zf[parseInt(customEventData)], true, false);
    }

    public btn_wf1(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.wf1.indexOf(true)
        this.ruleSelect(this.toggle_wf1[originSelectIndex], false);
        this.ruleInfo.wf1[originSelectIndex] =false
        this.ruleInfo.wf1[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_wf1[parseInt(customEventData)], true);
    }

    public btn_wf2(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.wf2.indexOf(true)
        this.ruleSelect(this.toggle_wf2[originSelectIndex], false);
        this.ruleInfo.wf2[originSelectIndex] =false
        this.ruleInfo.wf2[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_wf2[parseInt(customEventData)], true);
    }

    public btn_wf3(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.wf3.indexOf(true)
        this.ruleSelect(this.toggle_wf3[originSelectIndex], false);
        this.ruleInfo.wf3[originSelectIndex] =false
        this.ruleInfo.wf3[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_wf3[parseInt(customEventData)], true);
    }


    public btn_wf4(event, customEventData)
    {
        this.ruleInfo.wf4[parseInt(customEventData)] = !this.ruleInfo.wf4[parseInt(customEventData)]
        this.ruleSelect(this.toggle_wf4[parseInt(customEventData)], this.ruleInfo.wf4[parseInt(customEventData)]);
        if(customEventData == "3" && this.ruleInfo.wf4[3]){
            this.ruleInfo.wf4[4] = false;
            this.ruleSelect(this.toggle_wf4[4], false);
        }
        if (customEventData == "4" && this.ruleInfo.wf4[4])
        {
            this.ruleInfo.wf4[3] = false;
            this.ruleSelect(this.toggle_wf4[3], false);
        }
        this.toggle_wf4[4].node.getChildByName("checkmark").active = this.ruleInfo.wf4[4];
        this.toggle_wf4[3].node.getChildByName("checkmark").active = this.ruleInfo.wf4[3];
    }

    public btn_gn(event, customEventData)
    {
        this.ruleInfo.gn[parseInt(customEventData)] = !this.ruleInfo.gn[parseInt(customEventData)]
        this.ruleSelect(this.toggle_gn[parseInt(customEventData)], this.ruleInfo.gn[parseInt(customEventData)]);
    }

    public btn_tg1(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.tg1.indexOf(true)
        this.ruleSelect(this.toggle_tg_1[originSelectIndex], false);
        this.ruleInfo.tg1[originSelectIndex] =false
        this.ruleInfo.tg1[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_tg_1[parseInt(customEventData)], true);
        if (this.ruleInfo.tg1.indexOf(true) == 0)
        {
            this.ruleInfo.tg2 = [true, false, false, false, false];
        }
        this.node.getChildByName("rule_tg2").active = this.ruleInfo.tg1.indexOf(true) != 0
    }

    
    public btn_tg2(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.tg2.indexOf(true)
        this.ruleSelect(this.toggle_tg_2[originSelectIndex], false);
        this.ruleInfo.tg2[originSelectIndex] =false
        this.ruleInfo.tg2[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_tg_2[parseInt(customEventData)], true);
    }

    public btn_zbcs(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.zbcs.indexOf(true)
        this.ruleSelect(this.toggle_zbcs[originSelectIndex], false);
        this.ruleInfo.zbcs[originSelectIndex] =false
        this.ruleInfo.zbcs[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_zbcs[parseInt(customEventData)], true, true);
    }
}
