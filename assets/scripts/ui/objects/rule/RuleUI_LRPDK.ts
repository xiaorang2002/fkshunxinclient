import { ListenerType } from './../../../data/ListenerType';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseRuleUI } from "./BaseRuleUI";
import { MessageManager } from "../../../../framework/Manager/MessageManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class RuleUI_LRPDK extends BaseRuleUI {
    protected static className = "RuleUI_LRPDK";


    private gpsList = [100,300,500,1000]

    private ruleInfo = {
        ju_shu: 0, // 局数下标
        card_opt:0, // 16张，15张
        sc: [true, false], // 赢家先出，轮流先出
        zf: [true, false, false],  // AA支付 老板支付 房主支付
        ren: [true],  // 二人局
        wf: [false, false, false, false, false, false, false, false, false, true, true], // 能出必出，最后三带一，四带二，四带三，剩一张不输分，随机先出，AAA为炸弹，去掉3、4
        gn: [true, false, true, true],// 手动准备
        zbcs: [true,false, false, false, false], // 10  15 30 60 90
        tg1: [true, false, false, false], // 不托管，30秒，60秒，120秒
        tg2: [true, false, false, false, false],
    }

    //局数
    @property([cc.Toggle])
    toggle_jushu: cc.Toggle[] = [];

    @property([cc.Toggle])
    toggle_ps: cc.Toggle[] = [];

    //支付
    @property([cc.Toggle])
    toggle_sc: cc.Toggle[] = [];

    //支付
    @property([cc.Toggle])
    toggle_zf: cc.Toggle[] = [];

    //玩法
    @property([cc.Toggle])
    toggle_wf: cc.Toggle[] = [];

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
            this.ruleInfo.sc[0] = oRule.play.zhuang.normal_round == 0
            this.ruleInfo.sc[1] = oRule.play.zhuang.normal_round == 1
            this.ruleInfo.card_opt = 0
            if (oRule.play.card_num == 15)
                this.ruleInfo.card_opt = 1

            this.ruleInfo.zf[0] = false
            this.ruleInfo.zf[oRule.pay.option - 1] = true
           
            this.ruleInfo.wf[0] = oRule.play.must_discard
            this.ruleInfo.wf[1] = oRule.play.san_dai_yi
            this.ruleInfo.wf[2] = oRule.play.si_dai_er
            this.ruleInfo.wf[3] = oRule.play.si_dai_san
            this.ruleInfo.wf[4] = oRule.play.lastone_not_consume
            this.ruleInfo.wf[5] = oRule.play.zhuang.first_round == 4
            this.ruleInfo.wf[6] = oRule.play.AAA_is_bomb
            this.ruleInfo.wf[7] = oRule.play.abandon_3_4
            if (oRule.play.bomb_score)
            {
                this.ruleInfo.wf[8] = oRule.play.bomb_score == 10
            }
            if (oRule.play.ready_timeout_option >= 0)
            {
                this.ruleInfo.zbcs[0] = false
                this.ruleInfo.zbcs[oRule.play.ready_timeout_option] = true
            }
            if (oRule.play.fan_chun == false)
                this.ruleInfo.wf[9] = false
            else
                this.ruleInfo.wf[9] = true
            if (oRule.play.plane_with_mix == false)
                this.ruleInfo.wf[10] = false
            else
                this.ruleInfo.wf[10] = true  
            this.ruleInfo.gn[0] = oRule.option.hand_ready
            this.ruleInfo.gn[1] = oRule.option.block_hu_dong
            if(oRule.option.owner_kickout_player == false)
                this.ruleInfo.gn[2] = false
            else
                this.ruleInfo.gn[2] = true
            if (oRule.option.request_dismiss == false)
                this.ruleInfo.gn[3] = false
            else
                this.ruleInfo.gn[3] = true 
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
            
        }
        else
        {
            let save_rule_lrpdk = cc.sys.localStorage.getItem("rule_lrpdk");
            if (save_rule_lrpdk != null) {
                var saveInfo = JSON.parse(save_rule_lrpdk);
                saveInfo.zf = this.ruleInfo.zf
                if (saveInfo.wf.length != 11)
                {
                    saveInfo.wf[9] = true
                    saveInfo.wf[10] = true
                }
                if (saveInfo.gn.length == 2)
                    saveInfo.gn = this.ruleInfo.gn
                this.ruleInfo = saveInfo
                cc.sys.localStorage.removeItem("rule_lrpdk");
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
        if (this.ruleInfo.card_opt == null || this.ruleInfo.card_opt == undefined)
        {
            this.ruleInfo.card_opt = 0
        }
        if (this.ruleInfo.gn.length == 3)
        {
            this.ruleInfo.gn[3] = true
        }
        this.toggle_sc[this.ruleInfo.sc.indexOf(true)].check();
        this.ruleSelect(this.toggle_sc[this.ruleInfo.sc.indexOf(true)], true);

        this.toggle_ps[this.ruleInfo.card_opt].check();
        this.ruleSelect(this.toggle_ps[this.ruleInfo.card_opt], true);

        this.toggle_jushu[this.ruleInfo.ju_shu].check();
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu], true);

        for (let idx = 0;idx<this.ruleInfo.wf.length;idx++)
        {  
            if (this.ruleInfo.wf[idx]){
                this.toggle_wf[idx].check();
                this.ruleSelect(this.toggle_wf[idx], true);
                this.ruleInfo.wf[idx] = true
            }
        }

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

        this.node.setContentSize(936, 1430);
        this.isInit = false;
        
    }

    public getRule()
    {
        var first_round = 3 // 房主先出
        if (this.ruleInfo.wf[5])
            first_round = 4 // 随机先出
        var room = null
        if (this.ruleInfo.tg1.indexOf(true) != 0)
        {
            trustee = {second_opt:this.ruleInfo.tg1.indexOf(true)-1, type_opt: 0}
            if (this.ruleInfo.tg2.indexOf(true) != 0)
                room = {player_count_option: 0, auto_dismiss:{ trustee_round: this.ruleInfo.tg2.indexOf(true)}}
        }
        if (room == null)
            room = {player_count_option: 0}
        var bomb_score = 5
        if (this.ruleInfo.wf[8])
            bomb_score = 10
        var cardNum = 16
        if (this.ruleInfo.card_opt == 1)
            cardNum = 15
        var trustee = {}
        if (this.ruleInfo.tg1.indexOf(true) != 0)
            trustee = {second_opt:this.ruleInfo.tg1.indexOf(true)-1, type_opt:0}
        var rule = {
            round: {option:this.ruleInfo.ju_shu},
            pay: {money_type: 1, option: this.ruleInfo.zf.indexOf(true)+1},
            room: room,
            play: {
                card_num:cardNum,
                zhuang:{normal_round:this.ruleInfo.sc.indexOf(true), first_round:first_round},
                must_discard: this.ruleInfo.wf[0],
                san_dai_yi: this.ruleInfo.wf[1],
                si_dai_er: this.ruleInfo.wf[2],
                si_dai_san: this.ruleInfo.wf[3],
                lastone_not_consume: this.ruleInfo.wf[4],
                AAA_is_bomb: this.ruleInfo.wf[6],
                abandon_3_4: this.ruleInfo.wf[7],
                fan_chun:this.ruleInfo.wf[9],
                plane_with_mix:this.ruleInfo.wf[10],
                bomb_score:bomb_score,
                ready_timeout_option:this.ruleInfo.zbcs.indexOf(true),
            },
            option:{
                hand_ready:this.ruleInfo.gn[0],    
                block_hu_dong:this.ruleInfo.gn[1],  
                owner_kickout_player: this.ruleInfo.gn[2],
                request_dismiss:this.ruleInfo.gn[3],            

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
        cc.sys.localStorage.setItem("rule_lrpdk", JSON.stringify(this.ruleInfo));

    }

    public setAllGrey()
    {
        return
        this.node.getChildByName("pingbi").active = true
        for (var idx = 0; idx < this.toggle_jushu.length; idx++)
            this.toggle_jushu[idx].interactable = false
        for (var idx = 0; idx < this.toggle_sc.length; idx++)
            this.toggle_sc[idx].interactable = false
        for (var idx = 0; idx < this.toggle_zf.length; idx++)
            this.toggle_zf[idx].interactable = false
        for (var idx = 0; idx < this.toggle_wf.length; idx++)
            this.toggle_wf[idx].interactable = false
        for (var idx = 0; idx < this.toggle_gn.length; idx++)
            this.toggle_gn[idx].interactable = false
        for (var idx = 0; idx < this.toggle_tg_1.length; idx++)
            this.toggle_tg_1[idx].interactable = false
    }

    public btn_jushu(event, customEventData)
    {
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu], false);
        this.ruleInfo.ju_shu = parseInt(customEventData);
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu], true);
        MessageManager.getInstance().messagePost(ListenerType.ruleCostChanged);
    }

    public btn_ps(event, customEventData)
    {
        this.ruleSelect(this.toggle_ps[this.ruleInfo.card_opt], false);
        this.ruleInfo.card_opt = parseInt(customEventData);
        this.ruleSelect(this.toggle_ps[this.ruleInfo.card_opt], true);
    }

    public btn_shouchu(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.sc.indexOf(true)
        this.ruleSelect(this.toggle_sc[originSelectIndex], false);
        this.ruleInfo.sc[originSelectIndex] =false
        this.ruleInfo.sc[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_sc[parseInt(customEventData)], true);
    }

    public btn_zhifu(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.zf.indexOf(true)
        this.ruleSelect(this.toggle_zf[originSelectIndex], false);
        this.ruleInfo.zf[originSelectIndex] =false
        this.ruleInfo.zf[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_zf[parseInt(customEventData)], true, false);
    }

    public btn_wf(event, customEventData)
    {
        this.ruleInfo.wf[parseInt(customEventData)] = !this.ruleInfo.wf[parseInt(customEventData)]
        this.ruleSelect(this.toggle_wf[parseInt(customEventData)], this.ruleInfo.wf[parseInt(customEventData)]);
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
