import { ClubRecordUI } from './../club/ClubRecordUI';
import { GameManager } from './../../../GameManager';
import { ShowRuleUI } from './../rule/ShowRuleUI';
import { GAME_TYPE, ConstValue, CP_ACTION } from './../../../data/GameConstValue';
import { Utils } from "../../../../framework/Utils/Utils";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import ZjScoreDetailPage_UI from '../mj/ZjScoreDetailPage_UI';
import CpRoundOver_UI from '../cp/CpRoundOver_UI';
import { cardChangPai, createCombinationList, outCardMoveAniEx } from '../../../data/cp/cpDefines';


const { ccclass, property } = cc._decorator;
@ccclass
export class PlayBackUI_CP extends BaseUI {
    protected static className = "PlayBackUI_CP";


    @property(cc.Node)
    nodeMid: cc.Node = null;
    @property(sp.Skeleton)
    nodeAnim: sp.Skeleton = null;
    @property([cc.SpriteFrame])
    stageSp: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    shuiyin_spf: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    mjSpf: cc.SpriteFrame[] = [];

    @property(sp.Skeleton)
    nodeToujiaAnim: sp.Skeleton = null;

    @property(cc.Node)
    mj_toujia: cc.Node = null;

    private readonly mjUrlToIndex = {
        "bg": 0, "bg_yellow": 1, "di": 2, "di_yellow": 3, "card1": 4, "card2": 5, "card3": 6, "card4": 7, "card5": 8,
        "card6": 9, "card7": 10, "card8": 11, "card9": 12, "card10": 13, "card11": 14, "card12": 15, "card13": 16, "card14": 17,
        "card15": 18, "card16": 19, "card17": 20, "card18": 21, "card19": 22, "card20": 23, "card21": 24, "cptb1": 25, "cptb2": 26,
        "cptb3": 27, "cptb4": 28, "cptb5": 29, "cptb6": 30, "cptb7": 31, "cptb8": 32, "cptb9": 33, "cptb10": 34, "cptb11": 35,
        "cptb12": 36, "cptb13": 37, "cptb14": 38, "cptb15": 39, "cptb16": 40, "cptb17": 41, "cptb18": 42, "cptb19": 43,
        "cptb20": 44, "cptb21": 45, "remain1": 46, "remain2": 47, "remain3": 48, "remain4": 49, "remain5": 50, "remain6": 51, "remain7": 52,
        "remain8": 53, "remain9": 54, "remain10": 55, "remain11": 56, "remain12": 57, "remain13": 58, "remain14": 59, "remain15": 60, "remain16": 61,
        "remain17": 62, "remain18": 63, "remain19": 64, "remain20": 65, "remain21": 66, "zgcp_bapai": 67, "zgcp_chipai": 68, "zgcp_toupai": 69,
    }
    private readonly effectPosList = [cc.v3(0, -125), cc.v3(292, 24), cc.v3(0, 174), cc.v3(-290, 24)] // 麻将pgh特效
    private readonly shuiYinMap = { 350: 0 }


    private gameRule = null;                // 游戏规则
    private zhuang = 0;
    private _playerInfoMap = new Map();      // 本局游戏数据
    private _playerCardMap = new Map();     // 本局玩家的牌node（手牌，桌牌，pgh牌）
    private playerNum = 0                   // 玩家人数
    private controlSeat = -1                // 当前轮到谁了
    private gameType = 0                   // 游戏类型
    private acitonTable = null              // 本局操作集合
    private curStep = 0;
    private playTime = null;
    private balanceInfo = null;
    private benji = null
    private curRound = null;
    private curHuNum = 0;                   // 当前胡的人数
    private cardNum = 0
    private speed = 1                       // 回放速度
    private handInitNum = 16
    private startTime = 0
    private roomId = 0

    private isPlay = null;
    private lastOutMj = 0;
    private lastOutSeat = 0;
    private addSize = 0
    private cardCache = new Map()
    private myId = 0
    private qghInfo = null
    private gameEndInfo = null

    // 新增20221230
    private combinationList = new Map<number, Array<cardChangPai>>();

    onLoad() {
        this.nodeAnim.setCompleteListener(() => {
            this.nodeAnim.node.active = false
        });
    }

    //时间刷新初始化
    initTime() {
        this.schedule(this.loop.bind(this), 0.25);
    }

    private loop() {
        //播放时间
        if (this.isPlay)
            this.playTime += 0.25;
        if (this.playTime >= this.speed) {
            this.playTime = 0;
            this.doActiton()
        }
    }

    public getRealSeatByRemoteSeat(seat) {
        var myInfo = this._playerInfoMap.get(0)
        var offset = myInfo.realSeat - myInfo.seat
        var otherRealSeat = (seat + offset + this.playerNum) % this.playerNum
        var seatMap = []
        if (this.playerNum == 2) // 2人坐0,2
            seatMap = [0, 2]
        else if (this.playerNum == 3) // 3人坐0,1,3号位
            seatMap = [0, 1, 3]
        else
            seatMap = [0, 1, 2, 3]
        return seatMap[otherRealSeat]
    }

    initView(type, info, playerId) {
        this.gameEndInfo = info
        this.myId = playerId
        this.addSize = this.node.getContentSize().width - ConstValue.SCREEN_W
        var playerNode = this.node.getChildByName("player_info").getChildByName("player" + 0)
        this.qghInfo = null
        playerNode.getChildByName("stage").position = cc.v3(this.addSize / 2, -222)
        try {
            this.gameRule = info.rule;
            this.zhuang = info.zhuang
            this.playerNum = info.players.length
            this.curStep = 0;
            this.lastOutMj = 0;
            this.lastOutSeat = 0;
            this.gameType = type
            this.acitonTable = info.action_table
            this.playTime = 0;
            this.balanceInfo = info.balance;
            this.benji = info.ben_ji
            this.curRound = info.cur_round
            this.startTime = info.start_game_time
            this.roomId = info.table_id
            this.initCardNum()

            this.updateMid()
            this.initPlayerInfo(info)
            this.initPlayerCard()
            this.updateTableView()
            this.initTime()
            this.setTopUI()
            this.initShuiYin()
            //两个玩家的时候切出一手牌
            this.takeOutOneHandCards(info.qie_pai)
            this.showLeftCards(info.all_pai)
            this.node.getChildByName("btn_play").active = false
            this.node.getChildByName("btn_pause").active = true
            this.node.getChildByName("btn_over").active = false
            this.isPlay = true;
            if (this.gameType == GAME_TYPE.ZGCP) // 
            {
                this.setBaoTing()
            }
        }
        catch (e) {
            console.log(e)
        }

    }
    showLeftCards(leftpai) {
        let remainCardsNode = cc.find("node_cardsMgr/remainCards", this.node)
        remainCardsNode.active = true
        this.node.getChildByName("sp_card_num").active = false
        let firstCard = remainCardsNode.getChildByName("mj_0")
        firstCard.active = true
        this.setMjTexture(firstCard, leftpai[0], 1)
        let remainCount = leftpai.length
        for (let i = 1; i < remainCount; i++) {
            let newCard = cc.instantiate(firstCard)
            newCard.name = "mj_" + i
            newCard.parent = firstCard.parent
            newCard.active = true
            this.setMjTexture(newCard, leftpai[i], 1)
        }
        remainCardsNode.getChildByName("firstMark").zIndex = 5
        this.cardNum = remainCount
    }
    takeOutOneHandCards(qieCard) {
        if (this.playerNum == 2 && qieCard && qieCard.length > 0) {
            cc.find("node_cardsMgr/takeOutCards", this.node).active = true
            let firstCard = cc.find("node_cardsMgr/takeOutCards/mj_0", this.node)
            let children = firstCard.parent.children
            for (let i = 0; i < qieCard.length; i++) {
                if (i < children.length) {
                    this.setMjTexture(children[i], qieCard[i], 1)
                } else {
                    let newCard = cc.instantiate(firstCard)
                    newCard.parent = firstCard.parent
                    this.setMjTexture(children[i], qieCard[i], 1)
                }
            }
        }
    }
    setTopUI() {
        this.node.getChildByName("label_room_id").getComponent(cc.Label).string = this.roomId.toString()
        this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.formatDate(this.startTime, 1)
    }

    setRound() {
        var list = [4, 8, 16]
        var ruleJuShu = list[this.gameRule.round.option];
        this.node.getChildByName("sp_round").active = true
        this.node.getChildByName("sp_round").getChildByName("label_round").getComponent(cc.Label).string = "第" + this.curRound + "/" + ruleJuShu + "局";
    }

    private initShuiYin() {
        return
        var shuiYinIdx = this.shuiYinMap[this.gameType]
        if (typeof shuiYinIdx != "number")
            return
        this.node.getChildByName("shuiyin").getComponent(cc.Sprite).spriteFrame = this.shuiyin_spf[shuiYinIdx]
        this.node.getChildByName("shuiyin").active = true
    }

    getMjSpriteFrame(url) {
        var idx = this.mjUrlToIndex[url]
        return this.mjSpf[idx]
    }

    initCardNum() {
        if (this.gameType == GAME_TYPE.ZGCP) {
            this.handInitNum = 16
            this.cardNum = 38
        }
    }

    initPlayerInfo(info) {
        let isFind = false
        for (let idx = 0; idx < this.playerNum; idx++) {
            let playerInfo = info.players[idx]
            if (playerInfo.guid == this.myId)
                isFind = true
        }
        if (!isFind) // 没有找到自己的座位
            this.myId = info.players[0].guid

        for (let idx = 0; idx < this.playerNum; idx++) {
            let playerInfo = info.players[idx]
            if (playerInfo.guid == this.myId) {
                let finalMsg = {
                    realSeat: 0,
                    seat: idx + 1,
                    id: playerInfo.guid,
                    name: playerInfo.nickname,
                    head: playerInfo.head_url,
                    sex: playerInfo.sex,
                    isZhuang: false,
                    isOnline: true,
                    isTrustee: false,
                    score: playerInfo.total_money,
                    inMj: playerInfo.start_pai.sort(function (a, b) { return a - b }),
                    outMj: [],
                    pgMj: [],
                }
                this._playerInfoMap.set(0, finalMsg);
                //console.log("---------Myseat----:-----------",idx + 1)
            }
        }
        for (let idx = 0; idx < this.playerNum; idx++) {
            let playerInfo = info.players[idx]
            if (playerInfo.guid != this.myId) {
                let realSeat = this.getRealSeatByRemoteSeat(idx + 1) as number
                let finalMsg = {
                    realSeat: realSeat,
                    seat: idx + 1,
                    id: playerInfo.guid,
                    name: playerInfo.nickname,
                    head: playerInfo.head_url,
                    sex: playerInfo.sex,
                    isZhuang: false,
                    isOnline: true,
                    isTrustee: false,
                    score: playerInfo.total_money,
                    inMj: playerInfo.start_pai.sort(function (a, b) { return a - b }),
                    outMj: [],
                    pgMj: [],
                }
                this._playerInfoMap.set(realSeat, finalMsg);
            }
        }
        this._playerInfoMap.forEach((infoObj, seat) => {
            let playerNode = this.node.getChildByName("player_info").getChildByName("player" + seat)
            let spHead = playerNode.getChildByName("sp").getComponent(cc.Sprite)
            Utils.loadTextureFromNet(spHead, infoObj.head)
            playerNode.getChildByName("label_name").getComponent(cc.Label).string = infoObj.name
            playerNode.getChildByName("score").getComponent(cc.Label).string = (infoObj.score / 100).toString()
            this.setZhuang(seat)
            playerNode.active = true
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).active = true
        })
    }

    private initPlayerCard() {
        this._playerInfoMap.forEach((infoObj, seat) => {
            var handMjNodeArry = []
            var handMjPosArry = []
            var outMjNodeArry = []
            var menMjNodeArry = []
            var pgMjArray = []
            var playerNode = this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat)
            // 动态克隆手牌
            let inFirstMjNode = playerNode.getChildByName("mj_in").getChildByName("mj_0");
            let inFirstMjPos = inFirstMjNode.position
            handMjNodeArry.push(inFirstMjNode);
            handMjPosArry.push(inFirstMjPos);

            // 动态克隆出的牌
            let outFirstMjNode = playerNode.getChildByName("mj_out").getChildByName("mj_0");
            let outMjParent = outFirstMjNode.parent
            for (var num = 0; num < 42; ++num) {
                //出牌初始化
                let outMjNode = cc.instantiate(outFirstMjNode)
                //outMjNode.zIndex = 44 - num
                outMjNode.parent = outMjParent
                outMjNodeArry.push(outMjNode);
            }

            // 碰杠牌初始化rcmd
            let mjnode = playerNode.getChildByName("mj_pg").getChildByName("mj_0");
            pgMjArray.push(mjnode);

            var info = {
                mjInArray: handMjNodeArry,
                mjOutArray: outMjNodeArry,
                mjPgArray: pgMjArray,
                mjPosArray: handMjPosArry,
                mjMenArry: menMjNodeArry,
            }
            this._playerCardMap.set(seat, info)
        })
    }

    private updateTableView() {
        this._playerInfoMap.forEach((infoObj, seat) => {
            this.handMjChange(seat);
        })
    }

    //设置是否听牌
    setTing(realSeat) {
        var tingNode = this.node.getChildByName("player_info").getChildByName("player" + realSeat).getChildByName("Layout").getChildByName("sp_ting")
        tingNode.active = this._playerInfoMap.get(realSeat).isTing;
    }

    setCardNum() {
        //this.node.getChildByName("sp_card_num").active = true
        //this.node.getChildByName("sp_card_num").getChildByName("label_card_num").getComponent(cc.Label).string = "" + this.cardNum + " 张";
        let cardNode = cc.find("node_cardsMgr/remainCards/mj_" + this.cardNum, this.node)
        if (cardNode) {
            cardNode.active = false
        }
    }

    /**玩家是否在线 */
    public setPlayerOnline(seat) {
        var onlineNode = this.node.getChildByName("player_info").getChildByName("player" + seat).getChildByName("online")
        onlineNode.active = !this._playerInfoMap.get(seat).isOnline;
    }

    public setTrustee(seat) {
        var tuoguanNode = this.node.getChildByName("player_info").getChildByName("player" + seat).getChildByName("tuoguanTip")
        tuoguanNode.active = this._playerInfoMap.get(seat).isTrustee;
    }

    public onActionWait(seat, actionMap) {
        if (actionMap.size == 0) {
            this.node.getChildByName("game_button_" + seat).active = false;
            return
        }
        var count = 1;
        if (actionMap.get(CP_ACTION.ACTION_TING)) {
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_ting").active = true;
            count += 1;
        }
        else
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_ting").active = false;

        if (actionMap.get(CP_ACTION.ACTION_CHI)) {
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_chi").active = true;
            count += 1;
        }
        else
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_chi").active = false;

        if (actionMap.get(CP_ACTION.ACTION_PENG)) {
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_peng").active = true;
            count += 1;
        }
        else
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_peng").active = false;

        if (actionMap.get(CP_ACTION.ACTION_TOU)) {
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_tou").active = true;
            count += 1;
        }
        else
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_tou").active = false;

        if (actionMap.get(CP_ACTION.ACTION_BA_GANG)) {
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_gang").active = true;
            count += 1;
        }
        else
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_gang").active = false;

        if (actionMap.get(CP_ACTION.ACTION_HU) || actionMap.get(CP_ACTION.ACTION_ZI_MO) || actionMap.get(CP_ACTION.ACTION_QIANG_GANG_HU)) {
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_hu").active = true;
            count += 1;
        }
        else
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_hu").active = false;

        if (actionMap.get(CP_ACTION.ACTION_GANG_HUAN_PAI)) {
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_huan").active = true;
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_huan").position = cc.v3(-220 * count, 0);
            count += 1;
        }
        else
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_huan").active = false;
        this.node.getChildByName("game_button_" + seat).active = true;
    }

    public clearWaitView() {
        this._playerInfoMap.forEach((infoObj, seat) => {
            this.node.getChildByName("game_button_" + seat).active = false;
        })
    }

    setZhuang(realSeat) {
        var masterNode = this.node.getChildByName("player_info").getChildByName("player" + realSeat).getChildByName("sp_master_bg")
        masterNode.active = this.zhuang == this._playerInfoMap.get(realSeat).seat
        if (masterNode.active)
            this._playerInfoMap.get(realSeat).isZhuang = true
    }
    setBaoTing() {
        let playerInfoNode = this.node.getChildByName("player_info")
        for (let balanceDetail of this.balanceInfo) {
            let seat = this.getRealSeatByRemoteSeat(balanceDetail.chair_id);
            let playerNode = playerInfoNode.getChildByName("player" + seat)
            //报
            if (balanceDetail.baoting != undefined && balanceDetail.baoting) {
                playerNode.getChildByName("sp_baoTing").active = true
            } else {
                playerNode.getChildByName("sp_baoTing").active = false
            }
        }
        this.isPlay = true // 报听完成后开始打牌
    }
    //刷新手牌麻将的显示(整体刷新)
    handMjChange(realSeat) {
        this.controlSeat = realSeat

        let playerNode = this.node.getChildByName("node_cardsMgr").getChildByName("player" + realSeat)
        let inFirstMjNode = playerNode.getChildByName("mj_in").getChildByName("mj_0");
        //inFirstMjNode.getChildByName("gray").active = false

        let childAll = playerNode.getChildByName("mj_in").children
        childAll.forEach((cardNode) => {
            if (inFirstMjNode.uuid != cardNode.uuid) {
                cardNode.destroy()
            }
        })

        // 动态克隆手牌（暗牌）

        this.combinationList.clear();
        let combinationList = createCombinationList(this._playerInfoMap.get(realSeat).inMj)
        this.combinationList = combinationList

        let card_w = inFirstMjNode.getContentSize().width * inFirstMjNode.scale
        let card_h = inFirstMjNode.getContentSize().height * inFirstMjNode.scale
        let space_w = realSeat == 0 ? 1 : 0        //横向间隔
        let space_h = realSeat == 0 ? 60 : card_h   //竖向间隔

        let pos_w = 0
        let pos_h = realSeat == 0 ? -410 : 0       // 计算横向起始坐标
        let hand_card_offset_x = realSeat == 0 ? -60 : 0 // 手牌x坐标起始偏移
        // 双列
        if (combinationList.size % 2 == 0) {
            pos_w = hand_card_offset_x - ((combinationList.size / 2) * card_w) - ((combinationList.size / 2) - 1) * space_w - (1 / 2 * space_w) + (card_w / 2)
        }
        else {
            let count = Math.floor(combinationList.size / 2)
            pos_w = hand_card_offset_x - (count * card_w) - (count * space_w)
        }

        let listNum = 0
        let cardIndex = 0
        combinationList.forEach((element, key) => {
            for (let index_line = 0; index_line < element.length; index_line++) {
                let cardInfo = element[index_line];
                cardInfo.cardPos_x = pos_w + (listNum * (space_w + card_w))
                cardInfo.cardPos_y = pos_h + (index_line * space_h)

                let inMjNode: cc.Node = cc.instantiate(inFirstMjNode)
                inMjNode = cardIndex == 0 ? inFirstMjNode : cc.instantiate(inFirstMjNode)
                inMjNode.active = true
                inMjNode.position = cc.v3(cardInfo.cardPos_x, cardInfo.cardPos_y)
                inMjNode.zIndex = element.length - index_line    // 设置层级
                inMjNode.parent = inFirstMjNode.parent
                //inMjNode.getChildByName("gray").active = false

                cardInfo.cardNode = inMjNode
                cardInfo.curCardZOrder = element.length - index_line
                //0号玩家的手牌和其他玩家的手牌不一样
                if (realSeat == 0) {
                    this.setMjTexture(inMjNode, cardInfo.cardIndex, 0)
                } else {
                    this.setMjTexture(inMjNode, cardInfo.cardIndex, 1)
                }

                cardIndex++
            }
            listNum++
        })
    }

    //刷新出牌显示(整体刷新)
    outMjChange(realSeat) {
        var outarray = this._playerInfoMap.get(realSeat).outMj;

        //需要隐藏和显示的牌
        for (var i = 0; i < this._playerCardMap.get(realSeat).mjOutArray.length; ++i) {
            if (i < outarray.length)
                this.setMjTexture(this._playerCardMap.get(realSeat).mjOutArray[i], outarray[i], 1);
            else
                this._playerCardMap.get(realSeat).mjOutArray[i].active = false;
        }
    }

    //刷新碰杠显示(整体刷新)
    pgMjChange(realSeat) {
        this._playerCardMap.get(realSeat).mjPgArray.forEach((cardNode) => {
            cardNode.active = false
        })
        let pgarray = this._playerInfoMap.get(realSeat).pgMj;
        let pgNode = this._playerCardMap.get(realSeat).mjPgArray[0]

        for (let j = 0; j < pgarray.length; ++j) {
            if (this._playerCardMap.get(realSeat).mjPgArray[j]) {
                this.setMjTexture(this._playerCardMap.get(realSeat).mjPgArray[j], pgarray[j], 2);
            } else {
                let newNode = cc.instantiate(pgNode)
                newNode.parent = pgNode.parent
                this._playerCardMap.get(realSeat).mjPgArray[j] = newNode
                this.setMjTexture(this._playerCardMap.get(realSeat).mjPgArray[j], pgarray[j], 2);
            }
        }
    }

    menArrayChange(realSeat) {
        var menarray = this._playerInfoMap.get(realSeat).menMj;
        for (var i = 0; i < this._playerCardMap.get(realSeat).mjMenArry.length; ++i) {
            if (i < menarray.length)
                this.setMjTexture(this._playerCardMap.get(realSeat).mjMenArry[i], menarray[i], 1);
            else
                this._playerCardMap.get(realSeat).mjMenArry[i].active = false;
        }
    }

    //移除手牌
    removeHandMj(seat, mjid, num) {
        for (let i = 0; i < num; ++i) {
            for (let j = 0; j < this._playerInfoMap.get(seat).inMj.length; ++j) {
                if (this._playerInfoMap.get(seat).inMj[j] === mjid) {
                    this._playerInfoMap.get(seat).inMj.splice(j, 1);
                    break;
                }
            }
        }
    }

    //寻找碰牌中是否有能杠的牌
    checkAnGang(handmj, mjid) {
        for (var i = 0; i < handmj.length - 1; ++i) {
            if (handmj[i] == mjid)
                return true;
        }
        return false;
    }

    private updateMid() {
        let children = this.nodeMid.getChildByName("sp_mid_bg").children;
        for (let i = 0; i < children.length; i++) {
            children[i].active = false;
        }
        if (this.controlSeat < 0)
            return
        var midChildNode = this.nodeMid.getChildByName("sp_mid_bg").getChildByName("sp_" + this.controlSeat)
        midChildNode.active = true;
    }

    /**动画改变 */ //吃1  碰:2, 巴:3,  偷4  胡:5,  吃来包牌:6,  天胡7  8 过 
    onAnimationPlay(event) {
        if (event.type != 8) {
            AudioManager.getInstance().playSFX("zgcp/" + event.audio)
        }

        if (event.type == 1 || event.type == 2 || event.type == 3 || event.type == 6) {
            //如果上一次打出或者翻出的牌存在 并且等于当前吃碰巴的牌
            if (this.lastOutMj > 0 && this.lastOutMj < 22 && this.lastOutMj == event.tile) {
                this.showOutOrOpenCard(false);
                this.lastOutMj = -1
                this.lastOutSeat = 0
            }
        }

        //let rotation = [0,90,180,270]
        this.nodeAnim.node.position = this.effectPosList[event.seat]
        this.nodeAnim.node.active = true
        //this.nodeAnim.node.rotation = rotation[event.seat]
        var effect = ["chi", "peng", "ba", "tou", "hu", "clbq", "thu"]
        this.nodeAnim.setAnimation(0, effect[event.type - 1], false)
    }
    //isOutCard = true说明是打出的牌  否则就是翻出的牌
    showOutOrOpenCard(isShow, isOutCard: boolean = false) {
        let showCard = cc.find(`node_cardsMgr/player${this.lastOutSeat}/mj_show/mj_0`, this.node)
        showCard.active = isShow
        if (isShow) {
            showCard.getChildByName("mark_out").active = isOutCard
            showCard.getChildByName("mark_open").active = !isOutCard
            this.setMjTexture(showCard, this.lastOutMj, 3);
        }

        // true 抓牌 出牌, false 出牌没人要 丢到弃牌区 (吃碰杠 丢弃 都是false)
        if (isShow && isOutCard == false) {
            let sp_card_num = this.node.getChildByName("sp_card_num")
            let sp_card_num_Pos = showCard.parent.convertToNodeSpace(sp_card_num.convertToWorldSpaceAR(cc.v2(0, 0)));
            outCardMoveAniEx(showCard, sp_card_num_Pos, cc.v3(0, 0), 0.1, null)
        }
    }
    private callBack() {
        this.nodeAnim.node.active = false;
    }

    private soundChange(seat, actionType) {
        if (this._playerInfoMap.get(seat).sex == 1) {
            AudioManager.getInstance().playSFX("man/" + actionType)
        }
        else {
            AudioManager.getInstance().playSFX("woman/" + actionType)
        }
    }


    private doActiton() {
        if (!this.isPlay)
            return
        this.clearWaitView()
        if (this.acitonTable.length < this.curStep + 1) {
            this.unscheduleAllCallbacks()
            this.node.getChildByName("btn_play").active = false
            this.node.getChildByName("btn_pause").active = false
            this.node.getChildByName("playback_left").active = false
            this.node.getChildByName("playback_right").active = false
            this.node.getChildByName("label_speed").active = false
            this.node.getChildByName("progress").active = false
            this.node.getChildByName("btn_over").active = true
            if (this.gameType == GAME_TYPE.ZGCP) {
                UIManager.getInstance().openUI(CpRoundOver_UI, 32, () => {
                    UIManager.getInstance().getUI(CpRoundOver_UI).getComponent("CpRoundOver_UI").playBackInitView(this.balanceInfo, this._playerInfoMap, this.gameRule, this.gameType, this.startTime, this.gameEndInfo);
                })
            }
            return
        }
        var actionInfo = this.acitonTable[this.curStep]
        if (actionInfo.act == "Draw") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            //this.controlSeat = seat
            this._playerInfoMap.get(seat).inMj.push(actionInfo.msg.tile);
            this.handMjChange(seat);
            //this.updateMid()
            this.cardNum -= 1
            this.setCardNum()
        }
        else if (actionInfo.act == "Round") {
            this.controlSeat = this.getRealSeatByRemoteSeat(actionInfo.msg.chair_id);
            this.updateMid()
        }
        else if (actionInfo.act == "Discard") {
            this.lastOutMj = actionInfo.msg.tile;
            //出牌
            this.lastOutSeat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            //this._playerInfoMap.get(this.lastOutSeat).outMj.push(this.lastOutMj);
            this.removeHandMj(this.lastOutSeat, this.lastOutMj, 1);
            this.handMjChange(this.lastOutSeat)
            this.showOutOrOpenCard(true, true)
            //this.outMjChange(this.lastOutSeat)
            AudioManager.getInstance().playSFX("outmj")
            AudioManager.getInstance().playSFX("zgcp/sn_zgcp_" + this.lastOutMj)
        }
        else if (actionInfo.act == "Chi") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            //吃牌方加入吃牌
            this._playerInfoMap.get(seat).pgMj.push(mjid, actionInfo.msg.other_tile);
            //吃牌方删除手牌
            this.removeHandMj(seat, actionInfo.msg.other_tile, 1);
            this.handMjChange(seat);
            this.pgMjChange(seat);
            let audioName = ["sn_zgcp_chi", "sn_zgcp_chi_cyzdyz"]
            let randIndex = Utils.reandomNumBoth(0, 1)
            let chiType = 1
            if (actionInfo.msg.substituteNum && actionInfo.msg.substituteNum > 0 && actionInfo.msg.substituteNum < 22) {
                chiType = 6
            }
            this.onAnimationPlay({ seat: seat, type: 1, tile: mjid, audio: audioName[randIndex] });
        }
        else if (actionInfo.act == "Peng") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            //碰牌方加入碰牌
            this._playerInfoMap.get(seat).pgMj.push(mjid, mjid, mjid);
            //碰牌方删除手牌
            this.removeHandMj(seat, mjid, 2);
            this.handMjChange(seat);

            //出牌方删除出牌
            //this._playerInfoMap.get(this.lastOutSeat).outMj.pop();
            //this.outMjChange(this.lastOutSeat)

            this.pgMjChange(seat);
            let audioName = ["sn_zgcp_zhua", "sn_zgcp_zhua2", "sn_zgcp_pen", "sn_zgcp_pen_wyud"]
            let randIndex = Utils.reandomNumBoth(0, 1)
            this.onAnimationPlay({ seat: seat, type: 2, tile: mjid, audio: audioName[randIndex] });
        }
        else if (actionInfo.act == "BaGang") {
            //巴 先判断手牌有几张巴的牌 有可能是碰牌或者偷牌转巴牌  也有可能是别人打出或翻出的牌  或者全部都是手牌
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            let handCards = this._playerInfoMap.get(seat).inMj
            let handCardCount = this.getCardCount(mjid, handCards)
            if (handCardCount > 0) {
                this.removeHandMj(seat, mjid, handCardCount);
                this.handMjChange(seat);
            }
            let pgCards = this._playerInfoMap.get(seat).pgMj
            let pgCardCount = this.getCardCount(mjid, pgCards)
            if (pgCardCount > 0) {
                let cardIndex = pgCards.indexOf(mjid)
                this._playerInfoMap.get(seat).pgMj.splice(cardIndex, 0, mjid)
            } else {
                this._playerInfoMap.get(seat).pgMj.push(mjid, mjid, mjid, mjid);
            }
            this.pgMjChange(seat);
            let audioName = ["sn_zgcp_ba", "sn_zgcp_ba_yyfan"]
            let randIndex = Utils.reandomNumBoth(0, 1)
            this.onAnimationPlay({ seat: seat, type: 3, tile: mjid, audio: audioName[randIndex] });
        }
        else if (actionInfo.act == "Tou") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            //偷
            this.removeHandMj(seat, mjid, 3);
            this._playerInfoMap.get(seat).pgMj.push(mjid, mjid, mjid);
            this.pgMjChange(seat);
            this.handMjChange(seat);
            this.onAnimationPlay({ seat: seat, type: 4, tile: mjid, audio: "sn_zgcp_wyt" });
        }
        else if (actionInfo.act == "Hu" || actionInfo.act == "QiangGangHu" || actionInfo.act == "ZiMo") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            this.onAnimationPlay({ seat: seat, type: 5, tile: mjid, audio: "sn_zgcp_hu" });
        }
        else if (actionInfo.act == "TianHu") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            this.onAnimationPlay({ seat: seat, type: 7, tile: mjid, audio: "sn_zgcp_hu" });
        }
        else if (actionInfo.act == "ZiMo") {
            this.curHuNum += 1
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            this.soundChange(seat, "zimo");
            this.setStage(seat, 2)
        }
        else if (actionInfo.act == "Ting") {
            //听
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            this._playerInfoMap.get(seat).isTing = true;
            var mjid = actionInfo.msg.tile
            this.soundChange(seat, "ting");
            this.setTing(seat)
        }
        else if (actionInfo.act == "Trustee") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            if (actionInfo.trustee)
                this._playerInfoMap.get(seat).isTrustee = true;
            else
                this._playerInfoMap.get(seat).isTrustee = false;
            this.setTrustee(seat)
            this.curStep += 1
            this.doActiton()
            return
        }
        else if (actionInfo.act == "Offline") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            this._playerInfoMap.get(seat).isOnline = false;
            this.setPlayerOnline(seat)
            this.curStep += 1
            this.doActiton()
            return
        }
        else if (actionInfo.act == "Reconnect") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            this._playerInfoMap.get(seat).isOnline = true;
            this.setPlayerOnline(seat)
            this.curStep += 1
            this.doActiton()
            return
        }
        else if (actionInfo.act == "WaitActions") {
            for (var info of actionInfo.data) {
                var seat = this.getRealSeatByRemoteSeat(info.chair_id);
                var actionMap = new Map();
                for (var idx = 0; idx < info.actions.length; idx++)
                    actionMap.set(info.actions[idx].action, info.actions[idx].tile)
                this.onActionWait(seat, actionMap)
            }
        }
        else if (actionInfo.act == "FanPai") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            this.controlSeat = seat
            if (actionInfo.msg.tile != null && actionInfo.msg.tile > 0 && actionInfo.msg.tile < 22) {
                AudioManager.getInstance().playSFX("zgcp/sn_zgcp_" + actionInfo.msg.tile)
            }
            //先隐藏上一次亮出的牌
            if (this.lastOutMj > 0 && this.lastOutMj < 22) {
                //将上一次翻出的牌放入弃牌区
                this._playerInfoMap.get(this.lastOutSeat).outMj.push(this.lastOutMj);
                this.outMjChange(this.lastOutSeat)
                this.showOutOrOpenCard(false)
            }

            //再显示这一次翻出的牌
            this.lastOutMj = actionInfo.msg.tile
            this.lastOutSeat = seat
            this.showOutOrOpenCard(true, false)
            this.updateMid()
            this.cardNum -= 1
            this.setCardNum()
        }
        else if (actionInfo.act == "Tuo") {
            for (let seat = 1; seat <= actionInfo.msg.tuos.length; seat++) {
                let realSeat = this.getRealSeatByRemoteSeat(seat)
                cc.find(`player_info/player${realSeat}/label_tuo`, this.node).getComponent(cc.Label).string = "坨数:" + actionInfo.msg.tuos[seat - 1]
            }
        }
        this.curStep += 1
        this.acitonTable.length < this.curStep + 1
        cc.find("progress/progress_label", this.node).getComponent(cc.Label).string = Math.floor((this.curStep / this.acitonTable.length) * 100).toString() + "%"
        cc.find("progress/spFill", this.node).width = Math.floor((this.curStep / this.acitonTable.length) * 300)
    }
    setInMjGrey(seat, mjList) {
        var idxList = []
        var tempCardList = JSON.parse(JSON.stringify(this._playerInfoMap.get(seat).inMj))
        for (var i = 0; i < mjList.length; i++) {
            var mjId = mjList[i]
            var idx = tempCardList.indexOf(mjId)
            tempCardList[idx] = -1
            idxList.push(idx)
        }
        for (var i = 0; i < this._playerCardMap.get(seat).mjInArray.length; i++) {
            if (idxList.indexOf(i) >= 0)
                this._playerCardMap.get(seat).mjInArray[i].getChildByName("gray").active = true
            else
                this._playerCardMap.get(seat).mjInArray[i].getChildByName("gray").active = false
        }
    }
    setStage(seat, huType) // 1 胡 2 自摸
    {
        if (!Utils.isXzmj(this.gameType))
            return
        var playerNode = this.node.getChildByName("player_info").getChildByName("player" + seat)
        playerNode.getChildByName("stage").active = true
        playerNode.getChildByName("stage").getComponent(cc.Sprite).spriteFrame = this.stageSp[(this.curHuNum - 1) + (huType - 1) * 3]
    }

    getCardCount(value, CardsArray) {
        let cardCount = 0
        CardsArray.forEach((card) => {
            if (value == card) {
                cardCount++
            }
        })
        return cardCount
    }

    //设置一张牌的显示，  type为0手牌   1为弃牌   2为吃碰杠的牌  3为翻出的那张大牌或者玩家打出的那张大牌
    setMjTexture(node, mjid, type, outact = null) {
        if (mjid == 255) {
            mjid = -1
        }
        if (mjid < 0 || mjid > 21) {
            //id非法并隐藏该节点
            node.active = false;
            return;
        }

        //为0为背面，需要单独处理
        if (mjid == 0) {
            let str = "bg";
            var style = cc.sys.localStorage.getItem("mjStyle")
            if (style && style == "yellow") {
                str += "_yellow"
            }
            this.setMjTextureNewLogic(node, str, null)
            node.active = true
        }
        else {
            let str = "";
            if (type == 0) {
                node.attr = mjid;
                str = "card" + mjid
                this.setMjTextureNewLogic(node.getChildByName("sp"), str)
            }
            else if (type == 1) {
                str = "remain" + mjid
                this.setMjTextureNewLogic(node, str)
            } else if (type == 2) {
                str = "cptb" + mjid
                this.setMjTextureNewLogic(node, str)
            } else if (type == 3) {
                str = "card" + mjid
                this.setMjTextureNewLogic(node.getChildByName("sp"), str)
            }
            node.active = true;
            if (outact != null)
                node.runAction(outact);
        }
    }

    public setMjTextureNewLogic(loadnode, url, needStyle = false) {
        var sprite = loadnode.getComponent(cc.Sprite)
        if (url == null || url == "") {
            sprite.spriteFrame = null;
            return;
        }

        var spriteFrame = this.getMjSpriteFrame(url)
        sprite.spriteFrame = spriteFrame;
    }

    protected getActionType(action) {
        //  碰:1, 直杠:2,  点炮:3,  自摸:4,  补杠:5,   暗杠:6,  慌庄:7,  其他:过(保留)
        var type = 0
        if (action == CP_ACTION.ACTION_PENG)
            type = 1
        else if (action == CP_ACTION.ACTION_MING_GANG)
            type = 2
        else if (action == CP_ACTION.ACTION_BA_GANG)
            type = 5
        else if (action == CP_ACTION.ACTION_HU)
            type = 3
        else if (action == CP_ACTION.ACTION_QIANG_GANG_HU) // 抢杠胡
            type = 12
        else if (action == CP_ACTION.ACTION_ZI_MO)
            type = 4
        else if (action == CP_ACTION.ACTION_TING)
            type = 8
        else if (action == CP_ACTION.ACTION_PASS)
            type = 9
        else if (action == CP_ACTION.ACTION_MEN)
            type = 10
        else if (action == CP_ACTION.ACTION_MEN_ZI_MO)
            type = 11
        else if (action == CP_ACTION.ACTION_FREE_BA_GANG)
            type = 5
        else if (action == CP_ACTION.ACTION_FREE_AN_GANG)
            type = 6
        else
            console.log("收到异常action------------------------------", action)
        return type
    }


    /**规则按钮 */
    private button_rule() {
        AudioManager.getInstance().playSFX("button_click")
        var info = {
            rule: JSON.stringify(this.gameRule),
            gameType: this.gameType,
        }
        UIManager.getInstance().openUI(ShowRuleUI, 34, () => {
            UIManager.getInstance().getUI(ShowRuleUI).getComponent("ShowRuleUI").initUI(info, 1);
        })
    }

    //关闭按钮
    close_button(event) {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(PlayBackUI_CP);
    }

    //暂停播放按钮
    play_pause_button(event) {
        AudioManager.getInstance().playSFX("button_click")
        if (this.isPlay) {
            this.isPlay = false;
            this.node.getChildByName("btn_play").active = true
            this.node.getChildByName("btn_pause").active = false
        }
        else {
            this.isPlay = true;
            this.node.getChildByName("btn_play").active = false
            this.node.getChildByName("btn_pause").active = true

        }
    }

    //暂停播放按钮
    playback_speed_button(event, customEventData) {
        AudioManager.getInstance().playSFX("button_click")
        if (customEventData == "right") {
            if (this.speed == 0.25)
                return
            this.speed /= 2
            var strSpeed = "1x"
            if (this.speed == 0.5)
                strSpeed = "2x"
            else if (this.speed == 0.25)
                strSpeed = "4x"
        }
        else {
            if (this.speed == 1)
                return
            this.speed *= 2
            var strSpeed = "1x"
            if (this.speed == 0.5)
                strSpeed = "2x"
            else if (this.speed == 0.25)
                strSpeed = "4x"
        }
        this.node.getChildByName("label_speed").getComponent(cc.Label).string = strSpeed
    }


    btn_round() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.gameType == GAME_TYPE.ZGCP) {
            UIManager.getInstance().openUI(CpRoundOver_UI, 32, () => {
                UIManager.getInstance().getUI(CpRoundOver_UI).getComponent("CpRoundOver_UI").playBackInitView(this.balanceInfo, this._playerInfoMap, this.gameRule, this.gameType, this.startTime, this.gameEndInfo);

            })
        }
    }

}
