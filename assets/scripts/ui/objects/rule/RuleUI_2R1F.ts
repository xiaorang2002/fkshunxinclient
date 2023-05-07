import { ListenerType } from './../../../data/ListenerType';
import { GameManager } from './../../../GameManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseRuleUI } from "./BaseRuleUI";
import { MessageManager } from "../../../../framework/Manager/MessageManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class RuleUI_2R1F extends BaseRuleUI {
    protected static className = "RuleUI_2R1F";


    private gpsList = [100,300,500,1000]

    private ruleInfo = {
        ju_shu: 0, // 局数下标
        fd: [true, false, false, false],  // 3,4,5,6番
        zf: [true, false, false],  // AA支付 老板支付 房主支付
        ren: [true],  // 四人局
        ps: [false, true], // 牌数 7 13
        pm: [true, false, false], // 条筒万
        wf1: [true, false ], // 自摸加翻，自摸加底
        wf2: [true, false ], // 点杠花（点炮，自摸）
        wf3: [true, false], // 查大叫，查小叫
        wf4: [false, false, false, false, false, false, false, false], // 幺九将对，门清中张，天地，胡牌提示， 2分起胡，夹心五，对对胡2番,四对
        wf5: [true, false, false], // 清一色0番 清一色1番   清一色2番
        gn: [true, false, true, true],// 手动准备 禁止互动 申请解散
        zbcs: [true,false, false, false, false], // 10  15 30 60 90
        tg1: [true, false, false, false], // 不托管，30秒，60秒，120秒
        tg2: [true, false, false, false, false],
        pf: [false], // 判罚
    }

    //局数
    @property([cc.Toggle])
    toggle_jushu: cc.Toggle[] = [];

    //番数
    @property([cc.Toggle])
    toggle_fd: cc.Toggle[] = [];

    //支付
    @property([cc.Toggle])
    toggle_zf: cc.Toggle[] = [];

    //牌数
    @property([cc.Toggle])
    toggle_ps: cc.Toggle[] = [];

    // 牌面
    @property([cc.Toggle])
    toggle_pm: cc.Toggle[] = [];

    //玩法1
    @property([cc.Toggle])
    toggle_wf_1: cc.Toggle[] = [];

    //玩法2
    @property([cc.Toggle])
    toggle_wf_2: cc.Toggle[] = [];

    //玩法3
    @property([cc.Toggle])
    toggle_wf_3: cc.Toggle[] = [];

    //玩法4
    @property([cc.Toggle])
    toggle_wf_4: cc.Toggle[] = [];

    //玩法5
    @property([cc.Toggle])
    toggle_wf_5: cc.Toggle[] = [];

    //功能
    @property([cc.Toggle])
    toggle_gn: cc.Toggle[] = [];

    //准备超时
    @property([cc.Toggle])
    toggle_zbcs: cc.Toggle[] = [];
    
    //判罚
    @property([cc.Toggle])
    toggle_pf: cc.Toggle[] = [];

    //托管1
    @property([cc.Toggle])
    toggle_tg_1: cc.Toggle[] = [];

    //托管2
    @property([cc.Toggle])
    toggle_tg_2: cc.Toggle[] = [];

    //判罚分数
    @property(cc.EditBox)
    editPf: cc.EditBox = null;

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
            this.ruleInfo.fd[0] = false
            this.ruleInfo.fd[oRule.fan.max_option] = true
            this.ruleInfo.zf[0] = false
            this.ruleInfo.zf[oRule.pay.option - 1] = true
            this.ruleInfo.ps[1] = false
            if (oRule.play.tile_count == 7)
                this.ruleInfo.ps[0] = true
            else
                this.ruleInfo.ps[1] = true
            this.ruleInfo.wf5[0] = false
            if (oRule.play.qing_yi_se_fan == 0)
                this.ruleInfo.wf5[0] = true
            else if (oRule.play.qing_yi_se_fan == 1)
                this.ruleInfo.wf5[1] = true
            else
                this.ruleInfo.wf5[2] = true
            this.ruleInfo.pm[0] = false
            this.ruleInfo.pm[oRule.play.tile_men] = true
            this.ruleInfo.wf1[0] = oRule.play.zi_mo_jia_fan
            this.ruleInfo.wf1[1] = oRule.play.zi_mo_jia_di
            this.ruleInfo.wf2[0] = oRule.play.dgh_dian_pao
            this.ruleInfo.wf2[1] = oRule.play.dgh_zi_mo
            this.ruleInfo.wf3[0] = oRule.play.cha_da_jiao
            this.ruleInfo.wf3[1] = oRule.play.cha_xiao_jiao
            this.ruleInfo.wf4[0] = oRule.play.yao_jiu
            this.ruleInfo.wf4[1] = oRule.play.men_qing
            this.ruleInfo.wf4[2] = oRule.play.tian_di_hu
            this.ruleInfo.wf4[3] = oRule.play.hu_tips
            this.ruleInfo.wf4[4] = oRule.play.hu_at_least_2
            if (oRule.play.jia_xin_5)
                this.ruleInfo.wf4[5] = true
            else
                this.ruleInfo.wf4[5] = false
            this.ruleInfo.wf4[6] = oRule.play.da_dui_zi_fan_2
            this.ruleInfo.wf4[7] = oRule.play.si_dui
            
            this.ruleInfo.gn[0] = oRule.option.hand_ready
            this.ruleInfo.gn[1] = oRule.option.block_hu_dong
            if (oRule.option.request_dismiss == false)
                this.ruleInfo.gn[2] = false
            else
                this.ruleInfo.gn[2] = true 
            if(oRule.option.owner_kickout_player == false)
                this.ruleInfo.gn[3] = false
            else
                this.ruleInfo.gn[3] = true
            if (oRule.play.ready_timeout_option >= 0)
            {
                this.ruleInfo.zbcs[0] = false
                this.ruleInfo.zbcs[oRule.play.ready_timeout_option] = true
            }

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
            // if(oRule.fine.score)
            // {
            //     this.ruleInfo.pf[0] = true
            //     this.editPf.string = oRule.fine.score.toString()
            // }

        }
        else
        {
            let save_rule_2r1f = cc.sys.localStorage.getItem("rule_2r1f");
            if (save_rule_2r1f != null) {
                var saveInfo = JSON.parse(save_rule_2r1f);
                saveInfo.zf = this.ruleInfo.zf
                if (saveInfo.gn.length != 4)
                    saveInfo.gn[3] = true
                this.ruleInfo = saveInfo
                cc.sys.localStorage.removeItem("rule_2r1f");
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
        if (this.ruleInfo.gn.length == 2)
        {
            this.ruleInfo.gn[2] = true
        }
        this.toggle_jushu[this.ruleInfo.ju_shu].check();
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu], true);

        this.toggle_fd[this.ruleInfo.fd.indexOf(true)].check();
        this.ruleSelect(this.toggle_fd[this.ruleInfo.fd.indexOf(true)], true);

        this.toggle_ps[this.ruleInfo.ps.indexOf(true)].check();
        this.ruleSelect(this.toggle_ps[this.ruleInfo.ps.indexOf(true)], true);

        this.toggle_pm[this.ruleInfo.pm.indexOf(true)].check();
        this.ruleSelect(this.toggle_pm[this.ruleInfo.pm.indexOf(true)], true);

        this.toggle_wf_1[this.ruleInfo.wf1.indexOf(true)].check();
        this.ruleSelect(this.toggle_wf_1[this.ruleInfo.wf1.indexOf(true)], true);

        this.toggle_wf_2[this.ruleInfo.wf2.indexOf(true)].check();
        this.ruleSelect(this.toggle_wf_2[this.ruleInfo.wf2.indexOf(true)], true);

        this.toggle_wf_3[this.ruleInfo.wf3.indexOf(true)].check();
        this.ruleSelect(this.toggle_wf_3[this.ruleInfo.wf3.indexOf(true)], true);

        this.toggle_wf_5[this.ruleInfo.wf5.indexOf(true)].check();
        this.ruleSelect(this.toggle_wf_5[this.ruleInfo.wf5.indexOf(true)], true);

        for (let idx=0; idx<this.ruleInfo.wf4.length;idx++)
        {  
            if (this.ruleInfo.wf4[idx]){
                this.toggle_wf_4[idx].check();
                this.ruleSelect(this.toggle_wf_4[idx], true);
                this.ruleInfo.wf4[idx] = true
            }
        }

        this.toggle_wf_4[7].node.active = this.ruleInfo.ps[0];

        // 判罚
        if (this.ruleInfo.pf[0]){
            this.toggle_pf[0].check();
            this.ruleSelect(this.toggle_pf[0], true);
            this.ruleInfo.pf[0] = true
        }

        for (let idx=0;idx <this.ruleInfo.gn.length;idx++)
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
        this.node.setContentSize(936, 1580);
        this.isInit = false;
    }

    public getRule()
    {
        var huan = {}
        var trustee = {}
        var room = null
        if (this.ruleInfo.tg1.indexOf(true) != 0)
        {
            trustee = {second_opt:this.ruleInfo.tg1.indexOf(true)-1, type_opt: 0}
            if (this.ruleInfo.tg2.indexOf(true) != 0)
                room = {player_count_option: 0, dismiss_all_agree: true, auto_dismiss:{ trustee_round: this.ruleInfo.tg2.indexOf(true)}}
        }
        if (room == null)
            room = {player_count_option: 0, dismiss_all_agree: true}
        var tileCount = 7
        var sidui = this.ruleInfo.wf4[7]
        if (this.ruleInfo.ps[1])
        {
            tileCount = 13
            sidui = false
        }
        var tileMen = this.ruleInfo.pm.indexOf(true)
        var qinYiSe = 0
        if (this.ruleInfo.wf5[1])
            qinYiSe = 1
        else if(this.ruleInfo.wf5[2])
            qinYiSe = 2
        var rule = {
            round: {option:this.ruleInfo.ju_shu},
            fan: {max_option:this.ruleInfo.fd.indexOf(true)},
            pay: {money_type: 1, option: this.ruleInfo.zf.indexOf(true)+1},
            room: room,
            huan: huan,
            play: {
                tile_count: tileCount, // 牌的张数
                tile_men: tileMen, // 打哪一门
                qing_yi_se_fan:qinYiSe,//亲一色番数
                zi_mo_jia_fan: this.ruleInfo.wf1[0], // 自摸加翻
                zi_mo_jia_di: this.ruleInfo.wf1[1], // 自摸加底
                dgh_dian_pao: this.ruleInfo.wf2[0], // 点杠花（点炮）
                dgh_zi_mo: this.ruleInfo.wf2[1], //  点杠花（自摸）
                cha_da_jiao: this.ruleInfo.wf3[0], // 大叫
                cha_xiao_jiao: this.ruleInfo.wf3[1], //  小叫
                yao_jiu: this.ruleInfo.wf4[0], // 幺九将对
                men_qing: this.ruleInfo.wf4[1], // 门清中张
                tian_di_hu: this.ruleInfo.wf4[2], // 天地胡
                hu_tips: this.ruleInfo.wf4[3], //  胡牌提示
                hu_at_least_2: this.ruleInfo.wf4[4], // 2分起胡
                jia_xin_5: this.ruleInfo.wf4[5], // 夹心五
                da_dui_zi_fan_2: this.ruleInfo.wf4[6], // 对对胡2番
                si_dui: sidui, // 四对
                ready_timeout_option:this.ruleInfo.zbcs.indexOf(true),
            },
            option:{
                hand_ready: this.ruleInfo.gn[0],
                block_hu_dong: this.ruleInfo.gn[1],
                request_dismiss:this.ruleInfo.gn[2],
                owner_kickout_player: this.ruleInfo.gn[3],
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
        cc.sys.localStorage.setItem("rule_2r1f", JSON.stringify(this.ruleInfo));

    }

    public setAllGrey()
    {
        return
        this.node.getChildByName("pingbi").active = true
        for (var idx = 0; idx < this.toggle_jushu.length; idx++)
            this.toggle_jushu[idx].interactable = false
        for (var idx = 0; idx < this.toggle_fd.length; idx++)
            this.toggle_fd[idx].interactable = false
        for (var idx = 0; idx < this.toggle_zf.length; idx++)
            this.toggle_zf[idx].interactable = false
        for (var idx = 0; idx < this.toggle_ps.length; idx++)
            this.toggle_ps[idx].interactable = false
        for (var idx = 0; idx < this.toggle_pm.length; idx++)
            this.toggle_pm[idx].interactable = false
        for (var idx = 0; idx < this.toggle_wf_1.length; idx++) 
            this.toggle_wf_1[idx].interactable = false
        for (var idx = 0; idx < this.toggle_wf_2.length; idx++)
            this.toggle_wf_2[idx].interactable = false
        for (var idx = 0; idx < this.toggle_wf_3.length; idx++)
            this.toggle_wf_3[idx].interactable = false
        for (var idx = 0; idx < this.toggle_wf_4.length; idx++)
            this.toggle_wf_4[idx].interactable = false
        for (var idx = 0; idx < this.toggle_wf_5.length; idx++)
            this.toggle_wf_5[idx].interactable = false
        for (var idx = 0; idx < this.toggle_gn.length; idx++)
            this.toggle_gn[idx].interactable = false
        for (var idx = 0; idx < this.toggle_tg_1.length; idx++)
            this.toggle_tg_1[idx].interactable = false
    }

    public onPfEditFinish()
    {
        var score = parseInt(this.editPf.string)
        if (isNaN(score)){
            this.editPf.string = "0"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
            return
        }
        this.editPf.string = score.toString()
    }

    public btn_jushu(event, customEventData)
    {
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu], false);
        this.ruleInfo.ju_shu = parseInt(customEventData);
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu], true);
        MessageManager.getInstance().messagePost(ListenerType.ruleCostChanged);
    }

    public btn_fan(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.fd.indexOf(true)
        this.ruleSelect(this.toggle_fd[originSelectIndex], false);
        this.ruleInfo.fd[originSelectIndex] =false
        this.ruleInfo.fd[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_fd[parseInt(customEventData)], true);
    }

    public btn_zhifu(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.zf.indexOf(true)
        this.ruleSelect(this.toggle_zf[originSelectIndex], false);
        this.ruleInfo.zf[originSelectIndex] =false
        this.ruleInfo.zf[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_zf[parseInt(customEventData)], true, false);
    }

    public btn_ps(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.ps.indexOf(true)
        this.ruleSelect(this.toggle_ps[originSelectIndex], false);
        this.ruleInfo.ps[originSelectIndex] =false
        this.ruleInfo.ps[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_ps[parseInt(customEventData)], true);
        this.toggle_wf_4[7].node.active = this.ruleInfo.ps[0];
    }

    public btn_pm(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.pm.indexOf(true)
        this.ruleSelect(this.toggle_pm[originSelectIndex], false);
        this.ruleInfo.pm[originSelectIndex] =false
        this.ruleInfo.pm[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_pm[parseInt(customEventData)], true);
    }

    public btn_wf1(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.wf1.indexOf(true)
        this.ruleSelect(this.toggle_wf_1[originSelectIndex], false);
        this.ruleInfo.wf1[originSelectIndex] =false
        this.ruleInfo.wf1[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_wf_1[parseInt(customEventData)], true);
         
    }

    public btn_wf2(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.wf2.indexOf(true)
        this.ruleSelect(this.toggle_wf_2[originSelectIndex], false);
        this.ruleInfo.wf2[originSelectIndex] =false
        this.ruleInfo.wf2[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_wf_2[parseInt(customEventData)], true);
         
    }

    public btn_wf3(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.wf3.indexOf(true)
        this.ruleSelect(this.toggle_wf_3[originSelectIndex], false);
        this.ruleInfo.wf3[originSelectIndex] =false
        this.ruleInfo.wf3[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_wf_3[parseInt(customEventData)], true);
         
    }

    public btn_wf5(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.wf5.indexOf(true)
        this.ruleSelect(this.toggle_wf_5[originSelectIndex], false);
        this.ruleInfo.wf5[originSelectIndex] =false
        this.ruleInfo.wf5[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_wf_5[parseInt(customEventData)], true);
         
    }
    
    public btn_wf4(event, customEventData)
    {
        this.ruleInfo.wf4[parseInt(customEventData)] = !this.ruleInfo.wf4[parseInt(customEventData)]
        this.ruleSelect(this.toggle_wf_4[parseInt(customEventData)], this.ruleInfo.wf4[parseInt(customEventData)]);
    }

    public btn_pf(event, customEventData)
    {
        this.ruleInfo.pf[parseInt(customEventData)] = !this.ruleInfo.pf[parseInt(customEventData)]
        this.ruleSelect(this.toggle_pf[parseInt(customEventData)], this.ruleInfo.pf[parseInt(customEventData)]);
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
