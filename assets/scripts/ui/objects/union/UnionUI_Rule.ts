import { ListenerType } from './../../../data/ListenerType';
import { GameManager } from './../../../GameManager';
import { MessageManager } from "../../../../framework/Manager/MessageManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Rule extends cc.Component {
    protected static className = "UnionUI_Rule";

    private ruleInfo = {
        ji_fen_men_kan: 0, // 积分门槛
        ji_fen_bei_shu: 1, // 积分倍数
        zui_di_men_kan: [false, true], // 最低门槛开关
        zui_di_men_kan_ji_fen: 0,
        consume_type: [true, false], // 大赢家，AA
        fencheng_type: [false, true], // 分段，百分比
        huo_mian:0,
        AA_score_consume: 0,
        big_win : [
            [99999,0],
            [0,0],
            [0,0],
            [0,0]
        ]
    }

    private isInit = false
    private timesList = [0, 0.01, 0.02, 0.03, 0.05, 0.1, 0.2, 0.3, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 50, 100]

    public static getDefaultRule()
    {
        var ruleInfo = {
            entry_score : 0, // 积分门槛
            score_rate : 1, // 积分倍数
            tax : {
                percentage_commission: true,
                AA : 0
            }
        }
        return ruleInfo
    }

    @property(cc.EditBox)
    edit_menkan: cc.EditBox = null;

    @property(cc.EditBox)
    edit_times: cc.EditBox = null;

    @property(cc.EditBox)
    edit_zuidi_menkan: cc.EditBox = null;

    @property(cc.EditBox)
    edit_AA: cc.EditBox = null;

    @property(cc.EditBox)
    edit_DYJ_fenshu1: cc.EditBox = null;

    @property(cc.EditBox)
    edit_DYJ_fenshu2: cc.EditBox = null;

    @property(cc.EditBox)
    edit_DYJ_fenshu3: cc.EditBox = null;

    @property(cc.EditBox)
    edit_DYJ_fenshu4: cc.EditBox = null;

    @property(cc.EditBox)
    edit_DYJ_consume1: cc.EditBox = null;

    @property(cc.EditBox)
    edit_DYJ_consume2: cc.EditBox = null;

    @property(cc.EditBox)
    edit_DYJ_consume3: cc.EditBox = null;

    @property(cc.EditBox)
    edit_DYJ_consume4: cc.EditBox = null;

    @property(cc.EditBox)
    edit_HM: cc.EditBox = null;

    //门槛开关
    @property([cc.Toggle])
    toggle_wf: cc.Toggle[] = [];

    //消耗类型
    @property([cc.Toggle])
    toggle_consume_type: cc.Toggle[] = [];

    //分成类型
    @property([cc.Toggle])
    toggle_fencheng_type: cc.Toggle[] = [];

    start()
    {

    }

    public initRule(ruleInfo: any = null) {
        this.isInit = true;
        this.initRuleInfoByData(ruleInfo)
        this.updateView();
    }

    public initRuleInfoByData(ruleInfo)
    {
        if (ruleInfo)
        {
            var oRule = ruleInfo
            this.ruleInfo.ji_fen_men_kan = parseFloat(oRule.entry_score)/100
            this.ruleInfo.ji_fen_bei_shu = oRule.score_rate
            if (oRule.min_score == null){
                this.ruleInfo.zui_di_men_kan[0] = false
                this.ruleInfo.zui_di_men_kan[1] = true
            }
            else
            {
                this.ruleInfo.zui_di_men_kan[0] = true
                this.ruleInfo.zui_di_men_kan[1] = false
                this.ruleInfo.zui_di_men_kan_ji_fen = parseFloat(oRule.min_score)/100
            }
            if (oRule.tax.AA != null){
                this.ruleInfo.consume_type[0] = false
                this.ruleInfo.consume_type[1] = true
                this.ruleInfo.AA_score_consume =  parseFloat(oRule.tax.AA)/100
            }
            else
            {
                this.ruleInfo.consume_type[0] = true
                this.ruleInfo.consume_type[1] = false
                this.ruleInfo.big_win = this.parseBigWin(oRule.tax.big_win) 
                if (oRule.tax.min_ensurance)
                    this.ruleInfo.huo_mian = parseFloat(oRule.tax.min_ensurance)/100
            }
            this.ruleInfo.fencheng_type[0] = false
            if (oRule.tax.percentage_commission == true)
                this.ruleInfo.fencheng_type[1] = true
            else
                this.ruleInfo.fencheng_type[0] = true

        }
    }

    public updateView() {
        this.edit_menkan.string = this.ruleInfo.ji_fen_men_kan.toString()
        this.edit_times.string = this.ruleInfo.ji_fen_bei_shu.toString()
        this.edit_zuidi_menkan.string = this.ruleInfo.zui_di_men_kan_ji_fen.toString()
        this.edit_AA.string = this.ruleInfo.AA_score_consume.toString()

        this.toggle_wf[this.ruleInfo.zui_di_men_kan.indexOf(true)].check();
        this.ruleSelect(this.toggle_wf[this.ruleInfo.zui_di_men_kan.indexOf(true)], true);

        this.toggle_consume_type[this.ruleInfo.consume_type.indexOf(true)].check();
        this.ruleSelect(this.toggle_consume_type[this.ruleInfo.consume_type.indexOf(true)], true);

        if (this.ruleInfo.fencheng_type)
        {
            this.toggle_fencheng_type[this.ruleInfo.fencheng_type.indexOf(true)].check();
            this.ruleSelect(this.toggle_fencheng_type[this.ruleInfo.fencheng_type.indexOf(true)], true);
        }
        
        if (this.ruleInfo.consume_type.indexOf(true) == 0)
            var bDyj = true
        else
            var bDyj = false
        this.node.getChildByName("AAscore").active = !bDyj
        this.node.getChildByName("dayinjia").active = bDyj
        this.node.getChildByName("huomian").active = bDyj
        this.edit_HM.string = this.ruleInfo.huo_mian.toString()
        for (var idx = 0; idx < this.ruleInfo.big_win.length; idx ++)
        {
            this.edit_DYJ_fenshu1.string = this.ruleInfo.big_win[0][0].toString()
            this.edit_DYJ_consume1.string = this.ruleInfo.big_win[0][1].toString()

            if (this.ruleInfo.big_win[1][0] == 0){
                this.node.getChildByName("dayinjia").getChildByName("fenshu2").active = false
                this.edit_DYJ_fenshu2.string = "0"
                this.edit_DYJ_consume2.string = "0"
            }
            else
            {
                this.node.getChildByName("dayinjia").getChildByName("fenshu2").active = true
                this.edit_DYJ_fenshu2.string = this.ruleInfo.big_win[1][0].toString()
                this.edit_DYJ_consume2.string = this.ruleInfo.big_win[1][1].toString()
                this.node.getChildByName("dayinjia").getChildByName("fenshu2").getChildByName("label_score").getComponent(cc.Label).string =  (parseFloat(this.edit_DYJ_fenshu1.string)+0.01).toString()
                
            }
            if (this.ruleInfo.big_win[2][0] == 0){
                this.node.getChildByName("dayinjia").getChildByName("fenshu3").active = false
                this.edit_DYJ_fenshu3.string = "0"
                this.edit_DYJ_consume3.string = "0"
            }
            else
            {
                this.node.getChildByName("dayinjia").getChildByName("fenshu3").active = true
                this.edit_DYJ_fenshu3.string = this.ruleInfo.big_win[2][0].toString()
                this.edit_DYJ_consume3.string = this.ruleInfo.big_win[2][1].toString()
                this.node.getChildByName("dayinjia").getChildByName("fenshu3").getChildByName("label_score").getComponent(cc.Label).string =  (parseFloat(this.edit_DYJ_fenshu2.string)+0.01).toString()
            }
            if (this.ruleInfo.big_win[3][0] == 0){
                this.node.getChildByName("dayinjia").getChildByName("fenshu4").active = false
                this.edit_DYJ_fenshu4.string = "0"
                this.edit_DYJ_consume4.string = "0"
            }
            else
            {
                this.node.getChildByName("dayinjia").getChildByName("fenshu4").active = true
                this.edit_DYJ_fenshu4.string = this.ruleInfo.big_win[3][0].toString()
                this.edit_DYJ_consume4.string = this.ruleInfo.big_win[3][1].toString()
                this.node.getChildByName("dayinjia").getChildByName("fenshu4").getChildByName("label_score").getComponent(cc.Label).string =  (parseFloat(this.edit_DYJ_fenshu3.string)+0.01).toString()
            }

        }

        this.node.setContentSize(1086, 650);
        this.isInit = false;
        
    }

    public getRule()
    {
        var minScore = 0
        var big_win = null
        var AAScore = null
        var tax = null
        if (this.ruleInfo.consume_type.indexOf(true) == 0){
            big_win = this.ruleInfo.big_win
            tax = {
                big_win: this.formatBigWin(this.ruleInfo.big_win),
                min_ensurance: this.ruleInfo.huo_mian*100,
                fixed_commission: this.ruleInfo.fencheng_type[0],
                percentage_commission: this.ruleInfo.fencheng_type[1]
            }
        }
        else{
            tax = {
                AA : this.ruleInfo.AA_score_consume * 100,
                fixed_commission: this.ruleInfo.fencheng_type[0],
                percentage_commission: this.ruleInfo.fencheng_type[1]
            }
        }
        var ruleInfo = null
        if (this.ruleInfo.zui_di_men_kan.indexOf(true) == 0)
        {
            ruleInfo = {
                entry_score : this.ruleInfo.ji_fen_men_kan * 100, // 积分门槛
                score_rate : this.ruleInfo.ji_fen_bei_shu, // 积分倍数
                min_score : this.ruleInfo.zui_di_men_kan_ji_fen*100,
                tax : tax
            }
        }
        else
        {
            ruleInfo = {
                entry_score : this.ruleInfo.ji_fen_men_kan * 100, // 积分门槛
                score_rate : this.ruleInfo.ji_fen_bei_shu, // 积分倍数
                tax : tax
            }
        }
        
        return ruleInfo
    }

    parseBigWin(lWin)
    {
        var finalList = [[9999900,0],[0,0],[0,0],[0,0],]
        var temp = JSON.parse(JSON.stringify(lWin))
        for (var i =0; i < 4; i++)
        {
            if (i + 1 <= temp.length)
                finalList[i] = temp[i]
                finalList[i][0] /= 100
                finalList[i][1] /= 100
                if (finalList[i][0] == -1)
                    finalList[i][0] = 99999
                if (finalList[i][1] == -1)
                    finalList[i][0] = 99999
                if (finalList[i][2] == -1)
                    finalList[i][0] = 99999
        }

        return finalList
    }

    formatBigWin(lWin)
    {
        var finalList = []
        var temp = JSON.parse(JSON.stringify(lWin))
        for (var i =0; i < temp.length; i++)
        {
            if (temp[i][0] != 0){
                temp[i][0] *= 100
                temp[i][1] *= 100
                finalList.push(temp[i])
            }
        }
        return finalList
    }

    updateMenKanOnScoreChange() // 当抽成发生改变时，需要改变门槛分数
    {
        if (this.ruleInfo.consume_type.indexOf(true) == 1) // AA
        {
            var menKan = this.ruleInfo.ji_fen_men_kan
            if (this.ruleInfo.AA_score_consume > menKan)
            {
                this.ruleInfo.ji_fen_men_kan = this.ruleInfo.AA_score_consume
                this.edit_menkan.string = this.ruleInfo.AA_score_consume.toString();
            }
        }
        else
        {
            var tempScore = 0
            var menKan = this.ruleInfo.ji_fen_men_kan
            for (var idx = 0; idx < this.ruleInfo.big_win.length; idx ++)
            {
                if (this.ruleInfo.big_win[idx][1] > tempScore)
                    tempScore = this.ruleInfo.big_win[idx][1]
            }
            if (tempScore > menKan)
            {
                this.ruleInfo.ji_fen_men_kan = tempScore
                this.edit_menkan.string = tempScore.toString();
            }
        }
    }

    public setAllGrey()
    {
        this.node.getChildByName("pingbi").active = true
        for (var idx = 0; idx < this.toggle_wf.length; idx++)
            this.toggle_wf[idx].interactable = false
        for (var idx = 0; idx < this.toggle_consume_type.length; idx++)
            this.toggle_consume_type[idx].interactable = false
    }


    public btn_menkan(event, customEventData)
    {
        var type = parseFloat(customEventData)
        var score = parseFloat(this.edit_menkan.string)
        if (type == 0) // 减
        {
            score -= 1
            if (score < 0)
                score = 0
        }
        else // 加
        {
            score += 1
            if (score > 99999)
                score = 99999
        }
        this.ruleInfo.ji_fen_men_kan = score 
        this.edit_menkan.string = score.toString();
        this.updateMenKanOnScoreChange()

    }

    public btn_times(event, customEventData)
    {
        var type = parseFloat(customEventData)
        var times = parseFloat(this.edit_times.string)
        var idx = this.timesList.indexOf(times)
        if (type == 0) // 减
        {
            idx -= 1
            if (idx < 0)
                idx = 0
        }
        else // 加
        {
            idx += 1
            if (idx > this.timesList.length - 1)
                idx = this.timesList.length - 1
        }
        this.ruleInfo.ji_fen_bei_shu = this.timesList[idx]
        this.edit_times.string = this.timesList[idx].toString();
    }

    public btn_menkan_zuidi(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.zui_di_men_kan.indexOf(true)
        this.ruleSelect(this.toggle_wf[originSelectIndex], false);
        this.ruleInfo.zui_di_men_kan[originSelectIndex] =false
        this.ruleInfo.zui_di_men_kan[parseFloat(customEventData)] = true;
        this.ruleSelect(this.toggle_wf[parseFloat(customEventData)], true);
        this.node.getChildByName("sp_menkan2").active = parseFloat(customEventData) == 0
    }

    public btn_consume(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.consume_type.indexOf(true)
        this.ruleSelect(this.toggle_consume_type[originSelectIndex], false);
        this.ruleInfo.consume_type[originSelectIndex] =false
        this.ruleInfo.consume_type[parseFloat(customEventData)] = true;
        this.ruleSelect(this.toggle_consume_type[parseFloat(customEventData)], true);
        this.node.getChildByName("AAscore").active = parseFloat(customEventData) == 1
        this.node.getChildByName("dayinjia").active = parseFloat(customEventData) == 0
        this.node.getChildByName("huomian").active = parseFloat(customEventData) == 0
    }
    
    public btn_fencheng(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.fencheng_type.indexOf(true)
        this.ruleSelect(this.toggle_fencheng_type[originSelectIndex], false);
        this.ruleInfo.fencheng_type[originSelectIndex] =false
        this.ruleInfo.fencheng_type[parseFloat(customEventData)] = true;
        this.ruleSelect(this.toggle_fencheng_type[parseFloat(customEventData)], true);
    }

    public btn_menkan_zuidi_score(event, customEventData)
    {
        var type = parseFloat(customEventData)
        var score = parseFloat(this.edit_zuidi_menkan.string)
        if (type == 0) // 减
        {
            score -= 1
        }
        else // 加
        {
            score += 1
            if (score > 99999)
                score = 99999
        }
        this.ruleInfo.zui_di_men_kan_ji_fen = score
        this.edit_zuidi_menkan.string = score.toString();
         
    }


    public btn_AA_scroe(event, customEventData)
    {
        var type = parseFloat(customEventData)
        var score = parseFloat(this.edit_AA.string)
        if (type == 0) // 减
        {
            score -= 1
            if (score < 0)
                score = 0
        }
        else // 加
        {
            score += 1
            if (score > 99999)
                score = 99999
        }
        this.ruleInfo.AA_score_consume = score
        this.edit_AA.string = score.toString();
        this.updateMenKanOnScoreChange()

    }

    public onMenKanEditFinish()
    {
        var score = parseFloat(this.edit_menkan.string)
        if (isNaN(score)){
            this.edit_menkan.string = "10"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        else
        {
            if (score > 99999)
                this.edit_menkan.string = "99999"
            else if (score < 0)
                this.edit_menkan.string = "10"
        }
        this.ruleInfo.ji_fen_men_kan = parseFloat(this.edit_menkan.string)
        this.updateMenKanOnScoreChange()
    }

    public onHuoMianEditFinish()
    {
        var score = parseFloat(this.edit_HM.string)
        if (isNaN(score)){
            this.edit_HM.string = "0"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        else
        {
            if (score < 0)
                this.edit_HM.string = "0"
        }
        this.ruleInfo.huo_mian = parseFloat(this.edit_HM.string)
        this.ruleInfo.huo_mian = parseFloat(parseFloat(this.edit_HM.string).toFixed(2))
        this.edit_HM.string = parseFloat(this.edit_HM.string).toFixed(2)
    }

    public onTimesEditFinish()
    {
        var score = parseFloat(this.edit_times.string)
        if (!isNaN(score)){

            if (this.timesList.indexOf(score) < 0)
                this.edit_times.string = "1"
            if (score > 100)
                this.edit_times.string = "100"
            else if (score < 0)
                this.edit_times.string = "1"
        }
        else
        {
            this.edit_times.string = "1"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        this.ruleInfo.ji_fen_bei_shu = parseFloat(this.edit_times.string)
    }

    public onZuiDiMenKanEditFinish()
    { 
        var score = parseFloat(this.edit_zuidi_menkan.string)
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_zuidi_menkan.string = "99999"
        }
        else{
            this.edit_zuidi_menkan.string = "1"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        this.ruleInfo.zui_di_men_kan_ji_fen = parseFloat(this.edit_zuidi_menkan.string)
    }

    public onAAEditChanged()
    {
        var score = parseFloat(this.edit_AA.string)
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_AA.string = "99999"
            else if (score < 0)
                this.edit_AA.string = "1"
        }
        else {
            this.edit_AA.string = "1"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        this.ruleInfo.AA_score_consume = parseFloat(this.edit_AA.string)
        this.updateMenKanOnScoreChange()
    }

    public onDYJfenshu1_edit()
    {
        var score = parseFloat(this.edit_DYJ_fenshu1.string)
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_DYJ_fenshu1.string = "99999"
            else if (score <= 0)
                this.edit_DYJ_fenshu1.string = "99999"
        }
        else {
            this.edit_DYJ_fenshu1.string = "99999"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        this.ruleInfo.big_win[0][0] = parseFloat(this.edit_DYJ_fenshu1.string)
        if (this.edit_DYJ_fenshu1.string == "99999")
        {
            this.ruleInfo.big_win[1][0] = 0
            this.ruleInfo.big_win[1][1] = 0
            this.ruleInfo.big_win[2][0] = 0
            this.ruleInfo.big_win[2][1] = 0
            this.ruleInfo.big_win[3][0] = 0
            this.ruleInfo.big_win[3][1] = 0
            this.node.getChildByName("dayinjia").getChildByName("fenshu2").active = false
            this.node.getChildByName("dayinjia").getChildByName("fenshu3").active = false
            return

        }
        if (this.edit_DYJ_fenshu2.string == "0"){
            this.edit_DYJ_fenshu2.string = "99999"
            this.ruleInfo.big_win[1][0] = 99999
        }
        if(parseFloat(this.edit_DYJ_fenshu2.string) < parseFloat(this.edit_DYJ_fenshu1.string))
        {
            // GameManager.getInstance().openWeakTipsUI("请设置一个大于当前起点小于"+ this.node.getChildByName("dayinjia").getChildByName("fenshu2").getChildByName("label_score").getComponent(cc.Label).string + "的值")
            this.edit_DYJ_fenshu1.string = this.node.getChildByName("dayinjia").getChildByName("fenshu2").getChildByName("label_score").getComponent(cc.Label).string
            return
        }
        this.node.getChildByName("dayinjia").getChildByName("fenshu2").getChildByName("label_score").getComponent(cc.Label).string =  (parseFloat(this.edit_DYJ_fenshu1.string)+0.01).toFixed(2).toString()
        this.node.getChildByName("dayinjia").getChildByName("fenshu2").active = true
        this.onDYJConsume2_edit()        
    }

    public onDYJfenshu2_edit()
    {
        var score = parseFloat(this.edit_DYJ_fenshu2.string)
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_DYJ_fenshu2.string = "99999"
            else if (score < 0)
                this.edit_DYJ_fenshu2.string = "99999"
        }
        else {
            this.edit_DYJ_fenshu2.string = "99999"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        if (parseFloat(this.edit_DYJ_fenshu2.string) <= parseFloat(this.edit_DYJ_fenshu1.string) + 0.01){
            this.edit_DYJ_fenshu2.string = "99999"
            // GameManager.getInstance().openWeakTipsUI("请设置一个大于当前起点小于99999的值")
            return
        }
        this.ruleInfo.big_win[1][0] = parseFloat(this.edit_DYJ_fenshu2.string) 
        if (this.edit_DYJ_fenshu2.string == "99999")
        {
            this.ruleInfo.big_win[2][0] = 0
            this.ruleInfo.big_win[2][1] = 0
            this.ruleInfo.big_win[3][0] = 0
            this.ruleInfo.big_win[3][1] = 0
            this.node.getChildByName("dayinjia").getChildByName("fenshu3").active = false
            this.node.getChildByName("dayinjia").getChildByName("fenshu4").active = false
            return
        }
        if (this.edit_DYJ_fenshu3.string == "0"){
            this.edit_DYJ_fenshu3.string = "99999"
            this.ruleInfo.big_win[2][0] = 99999
        }
        this.node.getChildByName("dayinjia").getChildByName("fenshu3").getChildByName("label_score").getComponent(cc.Label).string =  (parseFloat(this.edit_DYJ_fenshu2.string)+0.01).toFixed(2).toString()
        this.node.getChildByName("dayinjia").getChildByName("fenshu3").active = true
        this.onDYJConsume3_edit() 
    }

    public onDYJfenshu3_edit()
    {
        var score = parseFloat(this.edit_DYJ_fenshu3.string)
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_DYJ_fenshu3.string = "99999"
            else if (score < 0)
                this.edit_DYJ_fenshu3.string = "99999"
        }
        else {
            this.edit_DYJ_fenshu3.string = "99999"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        if (parseFloat(this.edit_DYJ_fenshu3.string) < parseFloat(this.edit_DYJ_fenshu2.string)){
            this.edit_DYJ_fenshu3.string = "99999"
            // GameManager.getInstance().openWeakTipsUI("请设置一个大于当前起点小于99999的值")
            return
        }
        this.ruleInfo.big_win[2][0] = parseFloat(this.edit_DYJ_fenshu3.string) 
        if (this.edit_DYJ_fenshu3.string == "99999")
        {
            this.ruleInfo.big_win[3][0] = 0
            this.ruleInfo.big_win[3][1] = 0
            this.node.getChildByName("dayinjia").getChildByName("fenshu4").active = false
            return
        }
        if (this.edit_DYJ_fenshu4.string == "0"){
            this.edit_DYJ_fenshu4.string = "99999"
            this.ruleInfo.big_win[3][0] = 99999
        }
        this.node.getChildByName("dayinjia").getChildByName("fenshu4").getChildByName("label_score").getComponent(cc.Label).string =  (parseFloat(this.edit_DYJ_fenshu3.string)+0.01).toFixed(2).toString()
        this.node.getChildByName("dayinjia").getChildByName("fenshu4").active = true
        this.onDYJConsume4_edit() 
    }

    public onDYJfenshu4_edit()
    {
        var score = parseFloat(this.edit_DYJ_fenshu4.string)
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_DYJ_fenshu4.string = "99999"
            else if (score < 0)
                this.edit_DYJ_fenshu4.string = "99999"
        }
        else {
            this.edit_DYJ_fenshu4.string = "99999"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        if (parseFloat(this.edit_DYJ_fenshu4.string) < parseFloat(this.edit_DYJ_fenshu3.string)){
            this.edit_DYJ_fenshu4.string = "99999"
            // GameManager.getInstance().openWeakTipsUI("请设置一个大于当前起点小于99999的值")
            return
        }
        this.ruleInfo.big_win[3][0] = parseFloat(this.edit_DYJ_fenshu4.string) 
    }

    public onDYJConsume1_edit()
    {
        var score = parseFloat(this.edit_DYJ_consume1.string)
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_DYJ_consume1.string = "99999"
            else if (score < 0)
                this.edit_DYJ_consume1.string = "10"
        }
        else {
            this.edit_DYJ_consume1.string = "10"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        this.ruleInfo.big_win[0][1] = parseFloat(this.edit_DYJ_consume1.string)
        this.updateMenKanOnScoreChange()

        if (this.node.getChildByName("dayinjia").getChildByName("fenshu2").active)
            this.onDYJConsume2_edit()
    }

    public onDYJConsume2_edit()
    {
        var score = parseFloat(this.edit_DYJ_consume2.string)
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_DYJ_consume2.string = "99999"
            else if (score < 0)
                this.edit_DYJ_consume2.string = "10"
        }
        else {
            this.edit_DYJ_consume2.string = "10"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        if (parseFloat(this.edit_DYJ_consume2.string) <= parseFloat(this.edit_DYJ_consume1.string)){
            this.edit_DYJ_consume2.string = (parseFloat(this.edit_DYJ_consume1.string) + 0.01).toFixed(2).toString()
            // GameManager.getInstance().openWeakTipsUI("请设置一个大于前一段分配积分的值")
        }
        this.ruleInfo.big_win[1][1] = parseFloat(this.edit_DYJ_consume2.string)
        this.updateMenKanOnScoreChange()

        if (this.node.getChildByName("dayinjia").getChildByName("fenshu3").active)
            this.onDYJConsume3_edit()
    }

    public onDYJConsume3_edit()
    {
        var score = parseFloat(this.edit_DYJ_consume3.string)
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_DYJ_consume3.string = "99999"
            else if (score < 0)
                this.edit_DYJ_consume3.string = "10"
        }
        else {
            this.edit_DYJ_consume3.string = "10"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        if (parseFloat(this.edit_DYJ_consume3.string) <= parseFloat(this.edit_DYJ_consume2.string)){
            this.edit_DYJ_consume3.string = (parseFloat(this.edit_DYJ_consume2.string) + 0.01).toFixed(2).toString()
            // GameManager.getInstance().openWeakTipsUI("请设置一个大于前一段分配积分的值")
        }
        this.ruleInfo.big_win[2][1] = parseFloat(this.edit_DYJ_consume3.string)
        this.updateMenKanOnScoreChange()

    }

    public onDYJConsume4_edit()
    {
        var score = parseFloat(this.edit_DYJ_consume4.string)
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_DYJ_consume4.string = "99999"
            else if (score < 0)
                this.edit_DYJ_consume4.string = "10"
        }
        else {
            this.edit_DYJ_consume4.string = "10"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        if (parseFloat(this.edit_DYJ_consume4.string) <= parseFloat(this.edit_DYJ_consume3.string)){
            this.edit_DYJ_consume4.string = (parseFloat(this.edit_DYJ_consume3.string) + 0.01).toFixed(2).toString()
            // GameManager.getInstance().openWeakTipsUI("请设置一个大于前一段分配积分的值")
        }
        this.ruleInfo.big_win[3][1] = parseFloat(this.edit_DYJ_consume4.string)
        this.updateMenKanOnScoreChange()
    }


       //规则按钮选择特效
       public ruleSelect(object : cc.Toggle, ischeck : boolean, isaction : boolean = true)
       {
           if (object == null)
               return;
           // let selectbg = object.node.getChildByName("sp_select_bg");
           let labeltitle = object.node.getChildByName("label_title");
           let outline = labeltitle.getComponent(cc.LabelOutline);
           if (ischeck)
           {
               // selectbg.active = true;
               let widthbg = labeltitle.width + 80;
               //需要动画
   
               if (!this.isInit && isaction)
               {
                //    labeltitle.color = new cc.Color(246, 233, 221);
                //    outline.enabled = true;
                   // let times = 0;
                   // let action0 = cc.callFunc(()=> {
                   //     if (times == 3)
                   //     {
                   //         labeltitle.color = new cc.Color(119, 12, 18);
                   //         outline.enabled = true;
                   //     }
                   //     selectbg.width = (widthbg / 5) * times;
                   //     times += 1;
                   // }, this);
                   // let action1 = cc.delayTime(0.05);
                   // object.node.runAction(cc.repeat(cc.sequence(action0,action1), 6));
               }
               else
               {
                //    outline.enabled = true;
                //    labeltitle.color = new cc.Color(246, 233, 221);
                   // selectbg.width = widthbg;
               }
           }
           else
           {
               // selectbg.active = false;
            //    outline.enabled = false;
            //    labeltitle.color = new cc.Color(124, 110, 100);
           }
       }

}
