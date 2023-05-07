import { ListenerType } from './../../../data/ListenerType';
import { GameManager } from './../../../GameManager';
import { MJ_ACTION, GAME_TYPE, ConstValue } from './../../../data/GameConstValue';
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { Utils } from "../../../../framework/Utils/Utils";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { ListenerManager } from "../../../../framework/Manager/ListenerManager";
import { GAME_STATE_MJ } from "../../../data/mj/defines";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SelfCardControl_MJ extends cc.Component {

    @property(cc.Integer)
    seat: number = 0;
    @property([cc.SpriteFrame])
    markSp: cc.SpriteFrame[] = [];
    /**手牌数组 node */
    private mjInArray = [];
    /**出牌数组 node */
    private mjOutArray = [];
    /**碰杠数组 */
    private mjPgArray = [];
    /**闷牌数组 */
    private mjMenArray = [];
    /**明牌数组 */
    private mjMpArray = [];
    /**位置数组 */
    private mjPosArray = [];
    /**是否可以操作牌的表识 */
    private canOperate = false;
    /**mj数据容器 */
    private mjData = null;
    /**用于做标记的节点 */
    private markNode = null;
    // 手牌麻将是否可点击和手牌数组一一对应
    private mjInArrayAbleMap = new Map()
    // 可以同时操作的牌的数量
    private operatorNum = 1

    private selectMjIdxList = [] // 当前选中麻将的下标列表用于血战中换牌操作
    private loadNum = 0
    private curLoadNum = 0
    private loadFunc = null
    private addSize = 0
    private cardCache = new Map()
    private handInitNum = 0

    onDataRecv()
    {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
    }

    onShow()
    {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
    }

    onDestroy(){
        ListenerManager.getInstance().removeAll(this);
        this.mjData = null;
    }

    resetDataOnBack()
    {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
    }

    private initListen()
    {
        ListenerManager.getInstance().add(ListenerType.mj_selectOutMjNull, this, this.onSelectOutMjNull);
        ListenerManager.getInstance().add(ListenerType.mj_huPaiTipsRec, this, this.huPaiTipsRec);
        ListenerManager.getInstance().add(ListenerType.mj_tingPaiTipsRec, this, this.tingPaiTipsRec);
        if (Utils.isXzmj(GameDataManager.getInstance().curGameType))
        {
            ListenerManager.getInstance().add(ListenerType.mjxz_hpStatusChanged, this, this.hpStatusChanged);
            ListenerManager.getInstance().add(ListenerType.mjxz_recDqResult, this, this.recDqResult);
            ListenerManager.getInstance().add(ListenerType.mjxz_recBaoTingResult, this, this.recBaoTingResult);
            ListenerManager.getInstance().add(ListenerType.mjxz_dqStatusChanged, this, this.dqStatusChanged)
            ListenerManager.getInstance().add(ListenerType.mjxz_BaotingStatusChanged, this, this.bTStatusChanged) 
        }
        
    }

    // 加载放在onload中防止父节点destroy的时候，当子节点没有被激活时，无法销毁的问题
    onLoad()
    {
        this.initListen()
        var parentSize = this.node.getParent().getParent().getContentSize()
        this.node.setContentSize(parentSize.width, parentSize.height);
        this.addSize = parentSize.width - ConstValue.SCREEN_W
        this.initMenCard()
        this.initArray()
        this.initMjListen()
        this.luoboActive()
    }

    luoboActive()
    {
        this.node.getChildByName("luobo").active = false
    }

    luoboActiveValue(v:number)
    {
       let luobo = this.node.getChildByName("luobo")
       luobo.active = true
       luobo.getChildByName("label").getComponent(cc.Label).string = "bx"+v
       luobo.runAction(cc.blink(0.2,1))
    }

    setAll(seat) {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        this.canOperate = false;
        this.markNode = null
        this.operatorNum = 1
        this.selectMjIdxList = []
        this.loadNum = 0
        this.curLoadNum = 0
        this.loadFunc = 0
        this.handMjChange(seat);
        this.outMjChange(seat);
        this.pgMjChange(seat);
        this.menArrayChange(seat)
        this.cancel_select_button()
        this.onHuPaiByXueZhan()
    }
    /**初始化node数组 */
    initArray() {
        this.mjInArray = [];
        this.mjInArrayAbleMap.clear();
        this.mjOutArray = [];
        this.mjPgArray = [];
        this.mjPosArray = [];
        this.canOperate = false;
        this.operatorNum = 1
        this.selectMjIdxList = []
        this.mjMpArray = []
        this.loadNum = 0
        this.curLoadNum = 0
        this.loadFunc = 0
        
        //根据选择麻将风格调整frame
        this.initCardStyle()

        // 动态克隆手牌（暗牌）
        var inFirstMjNode = this.node.getChildByName("mj_in").getChildByName("mj_0");
        var inMjParent = inFirstMjNode.parent
        inFirstMjNode.getChildByName("gray").active = false
        var initHandCardNum = null
        if ( GameDataManager.getInstance().getDataByCurGameType())
            initHandCardNum = GameDataManager.getInstance().getDataByCurGameType().getCurTypeHandMjNum() + 1
        else
            initHandCardNum = 14
        if (initHandCardNum == 8) // 7张牌和10张牌的手牌节点需要调整
            inFirstMjNode.x = 315.5
        else if (initHandCardNum == 11)
            inFirstMjNode.x = 191
        this.handInitNum = initHandCardNum  
        this.mjInArray.push(inFirstMjNode);
        this.mjInArrayAbleMap.set(inFirstMjNode.uuid, true)
        var space = 80
        inFirstMjNode.scale = 1.15
        space = 92
        if (this.addSize >= 160)
        {
            // inFirstMjNode.x -= 90
            inFirstMjNode.scale = 1.2  
            space = 97
        }
        if (this.addSize >= 200)
        {
            inFirstMjNode.x += (this.addSize-190)/2
        }
        this.mjPosArray.push(inFirstMjNode.position);

        // if (this.addSize >= 200)
        // {
        //     inFirstMjNode.width = 79 * 1.2
        //     inFirstMjNode.height = 117 * 1.2
        //     inFirstMjNode.y = 7
        //     inFirstMjNode.getChildByName("mark").y = 90
        //     inFirstMjNode.getChildByName("gray").width = 79 * 1.2
        //     inFirstMjNode.getChildByName("gray").height = 117 * 1.2
        //     space = 95
        //     var count = 0
        //     for (var child of this.node.getChildByName("mj_pg").children)
        //     {
        //         child.scale = 1.2
        //         child.x = child.x + count*37
        //         count++
        //     }
        // }

        for (var num = 1; num < initHandCardNum; ++num) {
            //手牌初始化
            var inMjNode = cc.instantiate(inFirstMjNode)
            var pos = cc.v3(num * space + inFirstMjNode.x, 0)
            if (num == initHandCardNum - 1) {
                var pos = cc.v3(num * space + inFirstMjNode.x + 39, 0)
            }
            inMjNode.parent = inMjParent
            inMjNode.getChildByName("gray").active = false
            this.mjInArray.push(inMjNode);
            this.mjInArrayAbleMap.set(inMjNode.uuid, true)
            this.mjPosArray.push(pos);
        }

        // 动态克隆手牌（明牌）
        var inFirstMpNode = this.node.getChildByName("mj_mp").getChildByName("mj_0");
        var inMpParent = inFirstMjNode.parent
        this.mjMpArray.push(inFirstMpNode);
        inFirstMpNode.scale = 1.15 
        if (this.addSize >= 160)
        {
            inFirstMpNode.scale = 1.2  
        }
        for (var num = 1; num < initHandCardNum; ++num) {
            var mpMjNode = cc.instantiate(inFirstMpNode)
            var pos = cc.v3(num * space + inFirstMjNode.x, 0)
            if (num == initHandCardNum - 1) {
                var pos = cc.v3(num * space + inFirstMjNode.x + 39, 0)
            }
            mpMjNode.parent = inMpParent
            this.mjMpArray.push(mpMjNode);
        }

        // 动态克隆出的牌
        var outFirstMjNode = this.node.getChildByName("mj_out").getChildByName("mj_0");
        var outMjParent = outFirstMjNode.parent
        var outFirstMjPos = outFirstMjNode.position
        for (var num = 0; num < 42; ++num) {
            //出牌初始化
            var outMjNode = cc.instantiate(outFirstMjNode)
            outMjNode.zIndex = 44 - num
            if (num < 11)
                outMjNode.setPosition(outFirstMjPos.x + num * 51, outFirstMjPos.y);
            else if (num < 22)
                outMjNode.setPosition(outFirstMjPos.x + (num-11) * 51, outFirstMjPos.y+62);
            else if (num < 33)
            {
                outMjNode.zIndex += 1.5*num
                outMjNode.setPosition(outFirstMjPos.x + (num-22) * 51, outFirstMjPos.y+13);
            }
            else if (num < 44)
            {
                outMjNode.zIndex += 1.2*num
                outMjNode.setPosition(outFirstMjPos.x + (num-33) * 51, outFirstMjPos.y+75);
            }
            outMjNode.parent = outMjParent
            this.mjOutArray.push(outMjNode);
        }
        // 碰杠牌初始化rcmd
        for (var k = 0; k < 4; ++k) {
            var mjnode = this.node.getChildByName("mj_pg").getChildByName("pg" + k);
            if (this.addSize >= 160)
                mjnode.x += k*20
            this.mjPgArray.push(mjnode);
        }
        
    }

    // 初始化闷牌位置
    initMenCard()
    {
        var menFirstMjNode = this.node.getChildByName("mj_men").getChildByName("mj_0");
        var menMjParent = menFirstMjNode.parent
        var menFirstMjPos = menFirstMjNode.position
        for (var num = 0; num < 12; ++num) {
            var menMjNode = cc.instantiate(menFirstMjNode)
            if (num < 6)
                menMjNode.setPosition(menFirstMjPos.x + num * 22, menFirstMjPos.y);
            else
                menMjNode.setPosition(menFirstMjPos.x + (num-6) * 22, menFirstMjPos.y - 29);
            menMjNode.parent = menMjParent
            this.mjMenArray.push(menMjNode);
        }
    }

    /** 初始化麻将的监听事件*/
    initMjListen() {
        function addListen(mjnode, _this) {
            //开启点击
            mjnode.on(cc.Node.EventType.TOUCH_START, function (event) {
                this.mjData = GameDataManager.getInstance().getDataByCurGameType();
                if (!this.mjInArrayAbleMap.get(mjnode.uuid) || this.operatorNum == 0) // 这张牌不能操作，或者可操作数量为0
                    return;
                if (this.mjData == null)
                    return;
                if (!this.mjData.gameinfo)
                    return;
                // 癞子不给操作
                if (this.mjData.laiziValue === mjnode.attr && GameDataManager.getInstance().curGameType == GAME_TYPE.YJMJ)
                    return
                if(this.operatorNum == 1) // 只能操作一张牌的时候
                {
                    if (this.mjData.gameinfo.curSelectMj !== null && this.mjData.gameinfo.curSelectMj === mjnode) {
                        if (this.canOperate && this.operatorNum > 0)
                            this.selfOutMj();
                        else {
                            this.setSelectMj(false);
                            this.mjData.setCurSelectMj(null);
                        }
                    }
                    else {
                        if (this.mjData.gameinfo.curSelectMj !== null)
                            this.setSelectMj(false);
                        this.mjData.setCurSelectMj(mjnode);
                        this.setSelectMj(true);
                    }
                }
                else
                {
                    if (this.mjData.gameinfo.rule.huan.type_opt == 0)  // 单色换牌
                    {
                        if (this.selectMjIdxList.length != 0){ // 已经有抬起的牌
                            var type = Math.floor(this.mjInArray[this.selectMjIdxList[0]].attr / 10)
                            if (type !=  Math.floor(mjnode.attr/10)){ // 选择了其它花色
                                this.selectMjIdxList = []
                            }
                        }
                    }
                    var mjIndex = this.mjInArray.indexOf(mjnode)
                    if (this.selectMjIdxList.indexOf(mjIndex) != -1) // 点击是已选中的牌
                        this.selectMjIdxList.splice(this.selectMjIdxList.indexOf(mjIndex),1);
                    else
                    {
                        this.selectMjIdxList.push(mjIndex)
                        if (this.selectMjIdxList.length > this.operatorNum)
                            this.selectMjIdxList.splice(0,1);
                    }
                    var selectMjList = []
                    this.setAllMjNodeDown()
                    for (var idx of this.selectMjIdxList)
                    {
                        this.setMjNodeUp(idx)
                        selectMjList.push(this.mjInArray[idx].attr)
                    }
                    this.mjData.playerInfoMap.get(0).selectHp = selectMjList
                }
                
            }.bind(_this));


            //抬起
            mjnode.on(cc.Node.EventType.TOUCH_END, function (event) {
                this.mjData = GameDataManager.getInstance().getDataByCurGameType();
                if (this.mjData == null)
                    return;
                if (!this.mjInArrayAbleMap.get(mjnode.uuid) || this.operatorNum != 1)
                    return;
                if (!this.mjData.gameinfo)
                    return;
                if (this.mjData.laiziValue === mjnode.attr && GameDataManager.getInstance().curGameType == GAME_TYPE.YJMJ)
                    return
                //拖拽释放
                if (this.canOperate && this.mjData.gameinfo.curSelectMj !== null && this.operatorNum > 0) {
                    if (this.mjData.gameinfo.curSelectMj.y < 40)
                        this.setSelectMj(true);
                    else if (this.mjData.gameinfo.curSelectMj.y < 130) {
                        this.setSelectMj(false);
                        this.mjData.setCurSelectMj(null);
                    }
                    else
                        this.selfOutMj();
                }
            }.bind(_this));

            //按钮取消
            mjnode.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
                this.mjData = GameDataManager.getInstance().getDataByCurGameType();
                if (this.mjData == null)
                    return;
                if (!this.mjInArrayAbleMap.get(mjnode.uuid) || this.operatorNum != 1)
                    return;
                if (!this.mjData.gameinfo)
                    return;
                //拖拽释放
                if (this.canOperate && this.mjData.gameinfo.curSelectMj !== null) {
                    if (this.mjData.gameinfo.curSelectMj.y < 40)
                        this.setSelectMj(true);
                    else if (this.mjData.gameinfo.curSelectMj.y < 130) {
                        this.setSelectMj(false);
                        this.mjData.setCurSelectMj(null);
                    }
                    else
                        this.selfOutMj();
                }
            }.bind(_this));

            //开启拖拽
            mjnode.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
                this.mjData = GameDataManager.getInstance().getDataByCurGameType();
                if (this.mjData == null)
                    return;
                if (!this.mjInArrayAbleMap.get(mjnode.uuid) || this.operatorNum != 1) 
                    return;
                if (!this.mjData.gameinfo)
                    return;
                if (this.mjData.laiziValue === mjnode.attr && GameDataManager.getInstance().curGameType == GAME_TYPE.YJMJ)
                    return
                if (this.canOperate && this.mjData.gameinfo.curSelectMj !== null) {
                    var delta = event.touch.getDelta();
                    this.mjData.gameinfo.curSelectMj.x += delta.x;
                    this.mjData.gameinfo.curSelectMj.y += delta.y;
                }
                else if (!this.canOperate) {
                    //拖拽特效
                    var pos = event.touch.getPreviousLocation();;
                    for (var i = 0; i < this.mjInArray.length; ++i) {
                        var box = this.mjInArray[i].getBoundingBoxToWorld();
                        if (pos.x > box.xMin && pos.x < box.xMax && pos.y > box.yMin && pos.y < box.yMax) {
                            if (this.mjData.gameinfo.curSelectMj != null) {
                                if (this.mjData.gameinfo.curSelectMj !== null)
                                    this.setSelectMj(false);
                                this.mjData.setCurSelectMj(this.mjInArray[i]);
                                this.setSelectMj(true);
                            }
                            break;
                        }
                    }
                }
            }.bind(_this));
        }
        for (var i = 0; i < this.mjInArray.length; ++i)
            addListen(this.mjInArray[i], this);
    }

    setCanOperate(bOperate)
    {
        this.canOperate = bOperate
        if (bOperate)
            this.updateMjColorByType()
    }

    initCardStyle()
    {
        var inFirstMjNode = this.node.getChildByName("mj_in").getChildByName("mj_0");
        var inFirstMpNode = this.node.getChildByName("mj_mp").getChildByName("mj_0");
        var outFirstMjNode = this.node.getChildByName("mj_out").getChildByName("mj_0");
        inFirstMjNode.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("mj_in_0", true)
        inFirstMpNode.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("mj_pg_0", true)
        outFirstMjNode.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("mj_out_2", true)
        for (var k = 0; k < 4; ++k) {
            var mjnode = this.node.getChildByName("mj_pg").getChildByName("pg" + k);
            for (var child of mjnode.children) {
                child.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("mj_pg_0", true)
            }
        }
    }
    
    onCardBgChange()
    {
        for (var handMj of this.mjInArray)
            handMj.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("mj_in_0", true)
        for (var mpdMj of this.mjMpArray)
            mpdMj.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("mj_pg_0", true)    
        for (var outMj of this.mjOutArray)
            outMj.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("mj_out_2", true)  
        for (var k = 0; k < 4; ++k) {
            var mjnode = this.node.getChildByName("mj_pg").getChildByName("pg" + k);
            for (var child of mjnode.children) {
                child.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("mj_pg_0", true)
            }
        }  
        
    }


    //出牌
    selfOutMj() {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        var mjarray = this.mjData.playerInfoMap.get(this.seat).cards;
        if (this.canOperate && mjarray.length % 3 == 2) {
            var mjid = this.mjData.gameinfo.curSelectMj.attr;
            if (!this.checkDqOnOutMj(mjid))
                return;
            this.setCanOperate(false);
            this.mjData.gameinfo.curSelectMj.active = false;
            this.mjData.gameinfo.curSelectOutMj = this.mjData.gameinfo.curSelectMj;
            this.checkIsErrorTuoGuan()
             //发送消息
             if (this.mjData.gameinfo.isTingClick) {
                MessageManager.getInstance().messageSend(Proto.CS_Maajan_Do_Action.MsgID.ID, {action: MJ_ACTION.ACTION_TING, valueTile: mjid });
                return
            }
            MessageManager.getInstance().messageSend(Proto.CS_Maajan_Action_Discard.MsgID.ID, { tile:mjid });
        }
        else
        {
            this.setSelectMj(false);
            this.mjData.setCurSelectMj(null);
        }
    }

    onSelectOutMjNull(msg)
    {
        var handNodes = this.mjInArray;
        for (var j = 0; j < handNodes.length; j++) {
            if (handNodes[j].attr == msg.mjId) {
                this.mjData.gameinfo.curSelectOutMj = handNodes[j];
            }
        }
    }


    //设置选择的麻将的位置
    setSelectMj(isup) {
        for (var i = 0; i < this.mjInArray.length; ++i) {
            if (this.mjInArray[i] === this.mjData.gameinfo.curSelectMj) {
                this.mjInArray[i].position = this.mjPosArray[i];
                if (isup)
                    this.mjInArray[i].y = 30;
                return;
            }
        }
    }

    loadedFinish()
    {
        if (this.loadNum == 0)
            return
        this.curLoadNum += 1
        if (this.curLoadNum == this.loadNum)
        {
            this.curLoadNum = 0
            this.loadNum = 0
            if(this.loadFunc > 0)
            {
                this.loadFunc -= 1
                this.node.getChildByName("mj_in").active = true
                var mjarray = []
                var hidenum = 0
                this.mjData = GameDataManager.getInstance().getDataByCurGameType();
                if(this.mjData && this.mjData.playerInfoMap.get(this.seat))
                {
                    mjarray = this.mjData.playerInfoMap.get(this.seat).cards
                    hidenum = this.mjData.playerInfoMap.get(this.seat).mjpg.length * 3
                }
                for (var i = 0; i < this.mjInArray.length; ++i) {
                    //位置信息和显示
                    if (i < hidenum || (mjarray.length % 3 === 1 && i === this.mjInArray.length -1)) {
                        continue;
                    }
                    else {
                        this.mjInArray[i].position = this.mjPosArray[i];
                        var mjId = mjarray[i - hidenum]
                        if (!mjId)
                            mjId = 1
                        this.setMjTexture(this.mjInArray[i], mjarray[i - hidenum], 0);
                    }
                }
                this.huPaiTipsRec()
                this.updateMjColorByType()
               
            }
            
        }
    }


    //设置一张牌的显示，type为0 手牌 1为 出牌,  outact 出现动画
    setMjTexture(node, mjid, type, outact = null) {
        if (mjid == 255)
        {
            mjid = 0
        }
        if (mjid < 0 || mjid > 37 || mjid == undefined) {
            //id非法并隐藏该节点
            node.active = false;
            return;
        }
        //为0为背面，需要单独处理
        if (mjid == 0) {
            var texture = ""
            if (type === 0)
                texture = "mj_pg_0"
            else if (type == 2)
                texture = "mj_pg_0_b"
            else
                texture = "mj_out_2_b"
            

            this.setMjTextureNewLogic(node, texture, true)
            this.setMjTextureNewLogic(node.getChildByName("sp"), "")
            node.active = true;

            // this.loadTextureAddCache(node, "/card_mj/"+texture,function () {node.active = true;})
            // this.loadTextureAddCache(node.getChildByName("sp"), "")
            return
        }
        else {
            node.attr = mjid;
            if (type === 2) {
                this.setMjTextureNewLogic(node, "mj_pg_0", true);
                this.setMjTextureNewLogic(node.getChildByName("sp"), "mj_" + mjid);
                node.active = true;
                if (outact != null)
                    node.runAction(outact);

                // this.loadTextureAddCache(node, "/card_mj/mj_pg_0")
                // this.loadTextureAddCache(node.getChildByName("sp"), "/card_mj/mj_" + mjid,
                //             function () {
                //                 node.active = true;
                //                 if (outact != null)
                //                     node.runAction(outact);
                // });
            }
            else if (type === 1) {
                this.setMjTextureNewLogic(node, "mj_out_2", true)
                this.setMjTextureNewLogic(node.getChildByName("sp"), "mj_" + mjid)
                node.active = true;
                if (outact != null)
                    node.runAction(outact);


                // this.loadTextureAddCache(node, "/card_mj/mj_out_2")
                // this.loadTextureAddCache(node.getChildByName("sp"), "/card_mj/mj_" + mjid,
                // function () {
                //     node.active = true;
                //     if (outact != null)
                //         node.runAction(outact);
                // });
            }
            else {
                this.setMjTextureNewLogic(node.getChildByName("sp"), "mj_" + mjid)
                node.active = true;
                if (outact != null)
                    node.runAction(outact);

                // this.loadTextureAddCache(node.getChildByName("sp"), "/card_mj/mj_" + mjid,
                // function () {
                //     node.active = true;
                //     if (outact != null)
                //         node.runAction(outact);
                //     this.loadedFinish()
                // }.bind(this));
            }

        }
    }

    //设置麻将的颜色
    setMjColor(node, color) {
        node.color = color;
        node.getChildByName("sp").color = color;
    }

    huPaiTipsRec()
    {
        if(Utils.isXzmj(GameDataManager.getInstance().curGameType))
        {
            var info = this.mjData.huInfoMap.get(this.seat) //已经胡牌后不进行此操作
            if (info)
                return
        }
        this.updateTingTipsMark(false)
    }

    tingPaiTipsRec()
    {
        var isRuleTing = this.mjData.gameinfo.isTingRule;
        var isClickTing = this.mjData.gameinfo.isTingClick;
        if (isRuleTing && isClickTing)
            this.updateTingTipsMark(true)
        else{
            for (var i = 0; i < this.mjInArray.length; ++i) {
                this.mjInArray[i].getChildByName("mark").active = false;
                this.mjInArrayAbleMap.set(this.mjInArray[i].uuid, true)
                this.setMjColor(this.mjInArray[i], cc.Color.WHITE);
                }
        }
    }

    updateTingTipsMark(isClickTing)
    {
        var tingarray = [];
        var mjarray = this.mjData.playerInfoMap.get(this.seat).cards;
        var hidenum = this.mjData.playerInfoMap.get(this.seat).mjpg.length * 3
        var tingLength = this.mjData.gameinfo.curJiao.length
        if (tingLength == 0)
            return
        var maxHuFan = this.mjData.gameinfo.curJiao[tingLength-1].maxHuFan
        var mostHuNum = this.mjData.gameinfo.curJiao[tingLength-1].mostHuNum
        for (var i = 0; i < this.mjInArray.length; ++i) {
            var ishumj = false;
            for (var j = 0; j < tingLength; ++j) {
                if (this.mjData.gameinfo.curJiao[j].discard == mjarray[i - hidenum]) {
                    var idx = 0
                    if (maxHuFan == this.mjData.gameinfo.curJiao[j].curHuMaxFan && maxHuFan != 0)
                        idx = 1
                    else if (mostHuNum == this.mjData.gameinfo.curJiao[j].curHuMjNum)
                        idx = 2
                    this.mjInArray[i].getChildByName("mark").getComponent(cc.Sprite).spriteFrame = this.markSp[idx];
                    this.mjInArray[i].getChildByName("mark").active = true
                    if (isClickTing)
                    {
                        this.mjInArrayAbleMap.set(this.mjInArray[i].uuid, true)
                        this.setMjColor(this.mjInArray[i], cc.Color.WHITE);
                    }
                    ishumj = true;
                    break;
                }
            }
            if (!ishumj) {
                this.mjInArray[i].getChildByName("mark").active = false;
                if (isClickTing)
                {
                    this.mjInArrayAbleMap.set(this.mjInArray[i].uuid, false)
                    this.setMjColor(this.mjInArray[i], cc.Color.GRAY);
                }
            }
        }
    }

    //刷新手牌麻将的显示
    handMjChange(seat) {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        if (seat != this.seat)
            return;
        // if (this.loadNum != 0){
        //     this.loadFunc +=1
        //     this.node.getChildByName("mj_in").active = false
        //     return
        // }
        var mjarray = this.mjData.playerInfoMap.get(seat).cards;
        if (mjarray.length == 0) {
            for (var i = 0; i < this.mjInArray.length; ++i) {
                this.mjInArray[i].attr = 0;
                this.setMjTexture(this.mjInArray[i], -1, 0);
            }
            return
        }
        //数据更新
        this.mjData.setCurSelectMj(null);
        var isRuleTing = this.mjData.gameinfo.isTingRule;
        var isTinged =this.mjData.playerInfoMap.get(seat).istinged;
        var isMened =this.mjData.playerInfoMap.get(seat).isMened;
        var isBaoTing =this.mjData.playerInfoMap.get(seat).baoTingResult;
        var isClickTing = this.mjData.gameinfo.isTingClick;
        var tileCount = this.mjData.getCurTypeHandMjNum()
        var tingarray = [];
        for (var i = 0; i < this.mjData.gameinfo.curJiao.length; ++i)
            tingarray.push(this.mjData.gameinfo.curJiao[i].discard);

        //需要隐藏和显示的牌
        // var hidenum = (4 - Math.floor(mjarray.length / 3)) * 3;
        var hidenum = this.mjData.playerInfoMap.get(this.seat).mjpg.length * 3
        // this.loadNum = mjarray.length
        for (var i = 0; i < this.mjInArray.length; ++i) {
            //位置信息和显示
            if (i < hidenum || (mjarray.length % 3 === 1 && i === this.mjInArray.length -1)) {
                this.mjInArray[i].attr = 0;
                this.mjInArray[i].active = false;
                this.mjInArray[i].getChildByName("mark").active = false;
                this.mjInArray[i].getChildByName("laizi").active = false
                continue;
            }
            else {
                this.mjInArray[i].position = this.mjPosArray[i];
                this.setMjTexture(this.mjInArray[i], mjarray[i - hidenum], 0);
                this.mjInArray[i].getChildByName("laizi").active = false
                if (mjarray[i - hidenum] == this.mjData.laiziValue)
                    this.mjInArray[i].getChildByName("laizi").active = true
            }
            //是否听牌，改变牌的状态
            if (isTinged || isMened || isBaoTing) {
                if (i === this.mjInArray.length -1) {
                    //this.mjInArray[i].getChildByName("mark").active = true;
                    this.mjInArrayAbleMap.set(this.mjInArray[i].uuid, true)
                    this.setMjColor(this.mjInArray[i], cc.Color.WHITE);
                }
                else {
                    this.mjInArray[i].getChildByName("mark").active = false;
                    this.mjInArrayAbleMap.set(this.mjInArray[i].uuid, false)
                    this.setMjColor(this.mjInArray[i], cc.Color.GRAY);
                }
            }
            else
                {
                    this.mjInArray[i].getChildByName("mark").active = false;
                    this.mjInArrayAbleMap.set(this.mjInArray[i].uuid, true)
                    this.setMjColor(this.mjInArray[i], cc.Color.WHITE);
                }
        }
    }

    updateHandMjStateByTing()
    {
        var isTinged =this.mjData.playerInfoMap.get(this.seat).istinged;
        var isMened =this.mjData.playerInfoMap.get(this.seat).isMened;
        for (var i = 0; i < this.mjInArray.length; ++i) {
            if (isTinged || isMened) {
                if (i === this.mjInArray.length -1) {
                    this.mjInArray[i].getChildByName("mark").active = true;
                    this.mjInArrayAbleMap.set(this.mjInArray[i].uuid, true)
                    this.setMjColor(this.mjInArray[i], cc.Color.WHITE);
                }
                else {
                    this.mjInArray[i].getChildByName("mark").active = false;
                    this.mjInArrayAbleMap.set(this.mjInArray[i].uuid, false)
                    this.setMjColor(this.mjInArray[i], cc.Color.GRAY);
                }
            }
        }
    }

    //刷新出牌显示
    outMjChange(seat) {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        if (seat != this.seat)
            return;
        var outarray = this.mjData.playerInfoMap.get(seat).outCard;
        //需要隐藏和显示的牌
       //需要隐藏和显示的牌
       for (var i = 0; i < this.mjOutArray.length; ++i) {
        if (i < outarray.length)
            this.setMjTexture(this.mjOutArray[i], outarray[i], 1);
        else
            this.mjOutArray[i].active = false;
        }
        //判断是否需要显示出牌提示标志
        if (this.mjData.playerInfoMap.get(seat).id == this.mjData.gameinfo.lastOutPid && this.mjData.gameinfo.lastOutMjId != -1) {
            
            if(this.markNode)
                this.removeMark()
            var mark = new cc.Node("mark");
            mark.position = cc.v3(0, 30);
            var msp = mark.addComponent(cc.Sprite);
            Utils.loadTextureFromLocal(msp, "/card_mj/mj_mark", function () { mark.active = true; });
            mark.parent = this.mjOutArray[outarray.length - 1];
            var seq = cc.sequence(cc.moveBy(0.5, cc.v2(0, 20)), cc.moveBy(0.5, cc.v2(0, -20)));
            mark.runAction(cc.repeatForever(seq));
            this.markNode = mark
        }
    }

    //刷新碰杠显示
    pgMjChange(seat) {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        if (seat != this.seat) {
            return;
        }
        var pgarray = this.mjData.playerInfoMap.get(seat).mjpg;
        var isTinged = this.mjData.playerInfoMap.get(seat).istinged;
        var isMened = this.mjData.playerInfoMap.get(seat).isMened;
        if (pgarray.length == 0){
            for (var i = 0; i < 4; ++i)
                this.mjPgArray[i].active = false
            return
        }

        for (var i = 0; i < 4; ++i) {
            MessageManager.getInstance().messagePost(ListenerType.mj_PGHTipsRec);
            if (i < pgarray.length) {
                this.mjPgArray[i].active = true;
                for (var j = 0; j < pgarray[i].length; ++j) {
                    //前3位先显示
                    if (j < 4) {
                        var mjnode = this.mjPgArray[i].getChildByName("mj_" + j);
                        var cardId = pgarray[i][j]
                        if ((pgarray[i][5] == 15 || pgarray[i][5] == 6) && j == 3)
                            cardId = 0
                        mjnode.getChildByName("laizi").active = false
                        if (cardId == this.mjData.laiziValue && this.mjData.laiziValue != 0)
                            mjnode.getChildByName("laizi").active = true
                        this.setMjTexture(mjnode, cardId, 2);
                        // 只有手牌变灰
                        // if (isTinged || isMened)
                        //     this.setMjColor(mjnode, cc.Color.GRAY);
                        // else
                        //     this.setMjColor(mjnode, cc.Color.WHITE);
                    }
                    // else
                    // {
                    //     //该位置表示碰杠的玩家位置
                    //     var bjnode = this.mjPgArray[i].getChildByName("seat");
                    //     //调整标记位置
                    //     if (pgarray[i][3] === -1)
                    //         bjnode.y = 58;
                    //     else
                    //         bjnode.y = 78;
                    //     //调整位置标记方向
                    //     bjnode.rotation = 90 * (2 - pgarray[i][j]);
                    // }
                }
            }
            else
                this.mjPgArray[i].active = false;
        }
        MessageManager.getInstance().messagePost(ListenerType.mj_removeMark);
    }

    menArrayChange(seat)
    {
        if (seat != this.seat)
            return;
        var menarray = this.mjData.playerInfoMap.get(seat).menCard;
        //需要隐藏和显示的牌
       //需要隐藏和显示的牌
       for (var i = 0; i < this.mjMenArray.length; ++i) {
        if (i < menarray.length)
        {
            var mjid = menarray[i]
            this.setMjTexture(this.mjMenArray[i], mjid, 1);
        }
        else
            this.mjMenArray[i].active = false;
        }
    }

    //摸牌
    getMj(msg) {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        var seat = this.mjData.getSeatById(msg.id);
        if (seat != this.seat) {
            return;
        }
        var mjarray = this.mjData.playerInfoMap.get(seat).cards;
        var mjid = mjarray[mjarray.length - 1];
        //设置牌的动画
        var lastMjIdx = this.mjInArray.length - 1
        var emptyMj = this.mjInArray[lastMjIdx];
        emptyMj.x = this.mjPosArray[lastMjIdx].x;
        emptyMj.y = this.mjPosArray[lastMjIdx].y + 50;
        // emptyMj.angle = -30;
        emptyMj.stopAllActions();
        this.setMjColor(emptyMj, cc.Color.WHITE);
        // var action = cc.spawn(cc.moveTo(0.3, this.mjPosArray[lastMjIdx]), cc.rotateTo(0.3, 0));
        emptyMj.getChildByName("laizi").active = false
        if (mjid == this.mjData.laiziValue)
            emptyMj.getChildByName("laizi").active = true
        var action = cc.moveTo(0.1, this.mjPosArray[lastMjIdx])
        if ((this.mjData.playerInfoMap.get(seat).istinged || this.mjData.playerInfoMap.get(seat).isMened || this.mjData.playerInfoMap.get(seat).baoTingResult) && this.mjData.gameinfo.state.size == 0)
        {
            var finish = cc.callFunc(function () {
                MessageManager.getInstance().messagePost(ListenerType.mj_handMjChanged, { id: msg.id });
                this.mjData.setOutCards(msg.id, this.mjData.playerInfoMap.get(seat).outCard)
            }.bind(this));
            var delaction = cc.delayTime(0.3);
            var finishout = cc.callFunc(function () {
                //如果已经听牌，可以自动打牌,就在该处自动打
                this.mjData.setCurSelectMj(this.mjInArray[lastMjIdx], false);
                this.selfOutMj();
            }.bind(this));
            this.setMjTexture(emptyMj, mjid, 0, cc.sequence(action, finish, delaction, finishout));
        }
        else
            this.setMjTexture(emptyMj, mjid, 0, action);
        this.setCanOperate(true)
        if (this.mjData.gameinfo.state.size != 0)
            this.setCanOperate(false)
    }

    //出牌
    outMj(msg) {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        var seat = this.mjData.getSeatById(msg.id);
        if (seat != this.seat) {
            return;
        }
        try{
            var mjindex = this.mjData.playerInfoMap.get(seat).outCard.length - 1;
            var lastMjIdx = this.mjInArray.length - 1
            if (mjindex < 0)
                mjindex = 0;
            var mjnode = this.mjOutArray[mjindex];
            this.setMjTexture(mjnode, this.mjData.gameinfo.lastOutMjId, 1);
            if (this.mjData.gameinfo.curSelectOutMj)
            {
                //调整空闲节点的位置
                for (var i = 0; i < this.mjInArray.length; ++i) {
                    if (this.mjInArray[i] === this.mjData.gameinfo.curSelectOutMj) {
                        var temp = this.mjInArray.splice(i, 1);
                        this.mjInArray.push(temp[0]);
                        this.mjData.gameinfo.curSelectOutMj.position = this.mjPosArray[lastMjIdx];
                        this.mjData.gameinfo.curSelectOutMj = null;
                        break;
                    }
                }
            }
            else
            {
                var idx = this.getCardIndexById(msg.outMjId)
                var temp = this.mjInArray.splice(idx, 1);
                temp[0].active = false
                this.mjInArray.push(temp[0]);
            }
            
            //寻找需要插入的位置 
            var tempArray =JSON.parse(JSON.stringify(this.mjData.playerInfoMap.get(seat).cards)) ;
            var hidenum = this.mjData.playerInfoMap.get(this.seat).mjpg.length * 3
            tempArray = Utils.sortHandCardByQue(this.mjData.playerInfoMap.get(seat).dqType, tempArray)
            var findindex = tempArray.lastIndexOf(this.mjInArray[this.mjInArray.length - 2].attr) + hidenum;
            //播放动画
            var speed = 0.1;
            var finish = cc.callFunc(function () {
               var mjData =  GameDataManager.getInstance().getDataByCurGameType();
               if (mjData) {
                    var seat = mjData.getSeatById(msg.id);
                    if (mjData.playerInfoMap.get(seat))
                    {
                    mjData.setHeadCard(msg.id,mjData.playerInfoMap.get(seat).cards)
                    mjData.setOutCards(msg.id,mjData.playerInfoMap.get(seat).outCard)
                    }
               }
            }.bind(this));
            if (findindex != this.mjInArray.length - 2) {
                //麻将的动画    
                var action1 = cc.spawn(cc.moveBy(speed, cc.v2(0, 150)), cc.rotateTo(speed, 30));
                var action2 = cc.moveTo(speed, cc.v2(this.mjPosArray[findindex].x, 150));
                var action3 = cc.callFunc(function () {
                    //将自己放入数组里面
                    var temp = this.mjInArray.splice(this.mjInArray.length -2, 1);
                    this.mjInArray.splice(findindex, 0, temp[0]);
                    //其他麻将归位
                    for (var i = 0; i < this.mjInArray.length - 1; ++i) {
                        if (i !== findindex)
                            this.mjInArray[i].runAction(cc.moveTo(speed - 0.1, this.mjPosArray[i]));
                    }
                    //麻将落下阶段
                    var action4 = cc.spawn(cc.moveBy(speed, cc.v2(0, -150)), cc.rotateTo(speed, 0));
                    this.mjInArray[findindex].runAction(cc.sequence(action4, finish));
                }.bind(this));
                this.mjInArray[this.mjInArray.length -2].runAction(cc.sequence(action1, action2, action3));
            }
            else {
                for (var i = 0; i < this.mjInArray.length - 1; ++i) {
                    if (i == this.mjInArray.length - 2)
                        this.mjInArray[i].runAction(cc.sequence(cc.moveTo(speed, this.mjPosArray[i]), finish));
                    else
                        this.mjInArray[i].runAction(cc.moveTo(speed, this.mjPosArray[i]));
                }
            }
    
            //把当前选中的麻将清空
            this.mjData.setCurSelectMj(null);
        }
        catch (e)
        {
            var inList = []
            for(var mjNode of this.mjInArray){
                if (mjNode.attr > 0)
                    inList.push(mjNode.attr)
            }
            if (this.mjData && this.mjData.playerInfoMap.get(seat))
            {
                this.mjData.setHeadCard(msg.id, this.mjData.playerInfoMap.get(seat).cards)
                this.mjData.setOutCards(msg.id, this.mjData.playerInfoMap.get(seat).outCard)
            }
        }
    }

    //全屏取消选中牌
    cancel_select_button() {
        if (this.mjData.gameinfo.curSelectMj == undefined || this.mjData.gameinfo.curSelectMj == null)
            return;

        if (this.mjData.gameinfo.curSelectMj !== null)
            this.setSelectMj(false);
        this.mjData.setCurSelectMj(null);
    }

    /**移除mark */
    removeMark() {
        if (this.markNode){
            var markParent = this.markNode.parent;
            if (markParent != null)
                markParent.removeChild(this.markNode)
            this.markNode = null
        }
    }

    // 抬起指定位置麻将
    setMjNodeUp(idx)
    {
        if (idx < this.mjInArray.length && this.mjInArray[idx])
            this.mjInArray[idx].y = 30;
    }

    // 所有抬起麻将复位
    setAllMjNodeDown()
    {
        for (var i = 0; i < this.mjInArray.length; ++i) {
            this.mjInArray[i].y = 0;
        }
    }

    getCardIndexById(mjId)
    {
        for(var i = this.mjInArray.length-1; i > 0 ; --i)
            if (this.mjInArray[i].attr == mjId)
                return i
        return -1
    }

    displaySelectCardInDesk(displayCard)
    {
        for (var i = 0; i < this.mjOutArray.length; ++i) {
            if (this.mjOutArray[i].active)
            {
                if (this.mjOutArray[i].attr == displayCard)
                    this.mjOutArray[i].color = new cc.Color(180,180,180)
                else
                    this.mjOutArray[i].color = new cc.Color(255,255,255)
            }
        }
    }

    resetCardColor()
    {
        for (var i = 0; i < this.mjOutArray.length; ++i)
        {
            if (this.mjOutArray[i].active)
                this.mjOutArray[i].color = new cc.Color(255,255,255)
        }
            
    }


    // 将某一类麻将变灰（万，筒，条）
    updateMjColorByType()
    {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        var isHasGrey = false
        var type = -1
        var mjarray = []
        if (this.mjData && this.mjData.playerInfoMap.get(0))
        {
            type = this.mjData.playerInfoMap.get(0).dqType
            mjarray = this.mjData.playerInfoMap.get(0).cards;
        }
        if (type < 0 || mjarray.length == 0)
            return
        var limitUp = 10
        var limitDown = 0
        if (type == 1)
        {
            limitUp = 20
            limitDown = 10
        }
        else if (type == 2)
        {
            limitUp = 30
            limitDown = 20 
        }
        var hidenum = this.mjData.playerInfoMap.get(this.seat).mjpg.length * 3
        for (var i = 0; i < mjarray.length; ++i) {
            // 幺鸡麻将幺鸡不变色
            if (GameDataManager.getInstance().curGameType == GAME_TYPE.YJMJ && mjarray[i] == this.mjData.laiziValue)
            {
                this.mjInArray[i+hidenum].getChildByName("gray").active = false
                this.mjInArrayAbleMap.set(this.mjInArray[i+hidenum].uuid, !isHasGrey)
            }
            // 自贡麻将幺鸡不变色
            else if (GameDataManager.getInstance().curGameType == GAME_TYPE.ZGMJ && mjarray[i] == this.mjData.laiziValue)
            {
                this.mjInArray[i+hidenum].getChildByName("gray").active = false
                this.mjInArrayAbleMap.set(this.mjInArray[i+hidenum].uuid, !isHasGrey)
            }
            else if (mjarray[i] > limitDown && mjarray[i] < limitUp && this.mjInArray[i+hidenum])
            {
                this.mjInArray[i+hidenum].getChildByName("gray").active = true
                this.mjInArrayAbleMap.set(this.mjInArray[i+hidenum].uuid, true)
                isHasGrey = true
            }
        }
        for (var i = 0; i < mjarray.length; ++i) {
            if ((mjarray[i] < limitDown || mjarray[i] > limitUp) && this.mjInArray[i+hidenum])
            {
                this.mjInArray[i+hidenum].getChildByName("gray").active = false
                this.mjInArrayAbleMap.set(this.mjInArray[i+hidenum].uuid, !isHasGrey)
            }
        }
    }
    updateMjColorByBaoTing(){
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        let mjarray = this.mjData.playerInfoMap.get(0).cards;
        if (mjarray.length == 0) {
            for (let i = 0; i < this.mjInArray.length; ++i) {
                this.mjInArray[i].attr = 0;
                this.setMjTexture(this.mjInArray[i], -1, 0);
            }
            return
        }
        let canOutcards = this.mjData.playerInfoMap.get(0).canOutcards;
        // if(canOutcards.length == 0){
        //     return
        // }

        let hidenum = this.mjData.playerInfoMap.get(this.seat).mjpg.length * 3
        for (let i = 0; i < mjarray.length; ++i) {
            if (canOutcards.indexOf(mjarray[i]) >= 0)
            {
                this.setMjColor(this.mjInArray[i+hidenum], cc.Color.WHITE);
                //this.mjInArray[i+hidenum].getChildByName("gray").active = true
                this.mjInArrayAbleMap.set(this.mjInArray[i+hidenum].uuid, true)
            }else if(this.mjInArray[i+hidenum]){
                this.setMjColor(this.mjInArray[i+hidenum], cc.Color.GRAY);
                this.mjInArrayAbleMap.set(this.mjInArray[i+hidenum].uuid, false)
            }
        }
    }
    checkDqOnOutMj(mjId)
    {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        var type = -1
        var mjarray = []
        if (this.mjData && this.mjData.playerInfoMap.get(0))
        {
            mjarray = this.mjData.playerInfoMap.get(0).cards;
            type = this.mjData.playerInfoMap.get(0).dqType
        }
        if (type < 0 || mjarray.length == 0)
            return true;
        var limitUp = 10
        var limitDown = 0
        if (type == 1)
        {
            limitUp = 20
            limitDown = 10
        }
        else if (type == 2)
        {
            limitUp = 30
            limitDown = 20 
        }
        var hasQueMj = false
        for (var i = 0; i < mjarray.length; ++i) {
            if (GameDataManager.getInstance().curGameType == GAME_TYPE.YJMJ && mjarray[i] == this.mjData.laiziValue){}
            else if (GameDataManager.getInstance().curGameType == GAME_TYPE.ZGMJ && mjarray[i] == this.mjData.laiziValue){}
            else if (mjarray[i] > limitDown && mjarray[i] < limitUp)
                hasQueMj = true
        }
        if (hasQueMj && (mjId < limitDown || mjId > limitUp)) // 有缺牌时，不能打手牌
            return false
        return true
    }


    updateCardsUpBySelect(selectList)
    {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        var idxList = []
        var tempCardList = JSON.parse(JSON.stringify(this.mjData.playerInfoMap.get(0).cards))
        for (var i = 0; i <selectList.length; i++)
        {
            var mjId = selectList[i]
            var idx = tempCardList.indexOf(mjId)
            tempCardList[idx] = -1
            idxList.push(idx)
        }
        this.selectMjIdxList = idxList
        for (var idx of idxList)
        {
            this.setMjNodeUp(idx)
        }
    }
//-------------------------------------------------------------血战接口部分-----------------------------------------------

     // 换牌完成后
     onRecHpResult()
     {
         if(this.mjData && this.mjData.playerInfoMap.get(0))
         {
             this.updateCardsUpBySelect(this.mjData.playerInfoMap.get(0).receiveHp)
             if (GameDataManager.getInstance().curGameType != GAME_TYPE.XZMJ && GameDataManager.getInstance().curGameType != GAME_TYPE.TR3F
             && GameDataManager.getInstance().curGameType != GAME_TYPE.ZGMJ) // 么有定缺阶段，直接出牌
             {
                 this.operatorNum = 1
                 this.setAllMjNodeDown()
             }
             else
                 this.operatorNum = 0
         }
     }

    onHuPaiByXueZhan()
    {
        if(!Utils.isXzmj(GameDataManager.getInstance().curGameType))
            return
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        if (this.mjData)
        {
            var info = this.mjData.huInfoMap.get(this.seat)
            if (!info)
            {
                this.mjMpArray[this.mjMpArray.length-1].active = false
                return
            }
            if (this.seat == 0) // 只有自己自摸的时候有这个判定
            {
                var myCardArry = this.mjData.playerInfoMap.get(this.seat).cards
                if (info.huType == 2 && myCardArry[myCardArry.length - 1] != info.huTile) // 自摸
                {
                    var idx = myCardArry.indexOf(info.huTile)
                    myCardArry.splice(idx, 1)
                    myCardArry.push(info.huTile)
                    this.mjData.playerInfoMap.get(this.seat).cards = myCardArry
                }
            }
            
            this.setMpTexture(this.mjMpArray[this.mjMpArray.length-1], info.huTile) 
            this.mjMpArray[this.mjMpArray.length-1].position = this.mjPosArray[this.mjMpArray.length-1]
            this.mjInArray[this.mjMpArray.length-1].active = false
            this.operatorNum = 0 // 已经胡牌后就不可操作牌了
            for (var i = 0; i < this.mjInArray.length; ++i) {
                this.mjInArray[i].getChildByName("mark").active = false;
            }
        }    
        else
        {
            this.mjMpArray[this.mjMpArray.length-1].active = false
        }
    }

    setMpTexture(node, mjid)
    {
        if (mjid < 0 || mjid > 37) {
            //id非法并隐藏该节点
            node.active = false;
            return;
        }
        var str = "mj_pg_0";
        this.setMjTextureNewLogic(node, str, true);
        this.setMjTextureNewLogic(node.getChildByName("sp"), "mj_" + mjid)
        node.active = true;

        // this.loadTextureAddCache(node, "/card_mj/" + str,function () {node.active = true;})
        // this.loadTextureAddCache(node.getChildByName("sp"), "/card_mj/mj_" + mjid)
    }

    autoHpTips()
    {
        if (this.mjData.gameinfo.rule.huan.count_opt>=0 && this.mjData.gameinfo.rule.play.exchange_tips){// 勾选了换牌并且勾选了提示
            this.selectMjIdxList = this.mjData.getAutoHpResult()
            var selectMjList = []
            this.setAllMjNodeDown()
            for (var idx = 0;idx < this.selectMjIdxList.length; idx++)
            {
                this.setMjNodeUp(this.selectMjIdxList[idx])
                selectMjList.push(this.mjInArray[this.selectMjIdxList[idx]].attr)
            }
            this.mjData.playerInfoMap.get(0).selectHp = selectMjList
        }
    }

    hpStatusChanged()
    {
        if (this.mjData.gameinfo.gameState == GAME_STATE_MJ.HUAN_PAI) // 换牌阶段
        {
            if (!this.mjData.playerInfoMap.get(0).exchanged) // 自己还没换牌
            {
               
                var oRule = this.mjData.gameinfo.rule
                this.operatorNum = 3
                if (oRule.huan.count_opt == 1)
                    this.operatorNum = 4
            }
            else // 换完牌了
            {
                this.setAllMjNodeDown()
                this.updateCardsUpBySelect(this.mjData.playerInfoMap.get(0).selectHp)
                this.operatorNum = 0
            }
        }
    }
    
    dqStatusChanged()
    {
        if (this.mjData.gameinfo.gameState == GAME_STATE_MJ.DING_QUE) // 还没定缺，在定缺阶段
        {
            if(!this.mjData.playerInfoMap.get(0).isDq) // 自己还没定缺
                this.operatorNum = 0
            else // 定缺完了
            {   
                if (this.operatorNum == 0)
                    this.operatorNum = 1
            }

        }
        if (this.mjData.gameinfo.gameState > GAME_STATE_MJ.PER_BEGIN && this.mjData.gameinfo.gameState < GAME_STATE_MJ.GAME_BALANCE) // 重连时收到定缺消息，并且当前游戏进度在游戏中时
        {
            this.updateMjColorByType()
        }
    }
    bTStatusChanged()
    {
        if (this.mjData.gameinfo.gameState == GAME_STATE_MJ.BAO_TING) // 还没报听，在报听阶段
        {
            if(!this.mjData.playerInfoMap.get(0).isBaoTing) // 自己还没报听
                this.operatorNum = 0
            else // 定缺完了
            {   
                if (this.operatorNum == 0)
                    this.operatorNum = 1
            }
        }
        //刷新手牌显示
        else if(this.mjData.gameinfo.gameState > GAME_STATE_MJ.PER_BEGIN && this.mjData.gameinfo.gameState < GAME_STATE_MJ.GAME_BALANCE){
            this.handMjChange(0)
        }
    }
    private recDqResult()
    {
        this.updateMjColorByType()
        this.operatorNum = 1
    }
    private recBaoTingResult(){
        let playerID = this.mjData.playerInfoMap.get(0).id
        //如果自己选择了报听 并且是庄家的时候第一次出牌的时候有限制  只能打服务器下发限制的牌
        if(this.mjData.playerInfoMap.get(0).baoTingResult /*&& playerID == this.mjData.gameinfo.dealerId*/){
            this.updateMjColorByBaoTing()
        }     
        this.operatorNum = 1
    }
    public hideGray()
    {
        for (var i = 0; i < this.mjInArray.length; ++i) {
            this.mjInArray[i].getChildByName("gray").active = false
        }
    }


    public loadTextureAddCache(loadnode, url: string, callback: any = null) {
        var sprite = loadnode.getComponent(cc.Sprite)
        if (url == null || url == "") {
            sprite.spriteFrame = null;
            if (callback != null)
                callback();
            return;
        }

        if (loadnode == null || sprite == null)
            return;
        if (this.cardCache.get(url))
        {
            sprite.spriteFrame = this.cardCache.get(url)
            if (callback != null)
                callback();
            return;
        }
        cc.resources.load(url, cc.SpriteFrame,
            function (err, spriteFrame) {
                if (err) {
                    return;
                }
                sprite.spriteFrame = spriteFrame;
                this.cardCache.set(url, spriteFrame)
                if (callback != null)
                    callback();
            }.bind(this));
    }

    public setMjTextureNewLogic(loadnode, url, needStyle = false) {
        var sprite = loadnode.getComponent(cc.Sprite)
        if (url == null || url == "") {
            sprite.spriteFrame = null;
            return;
        }
        var spriteFrame = this.getSpriteFrameFromParent(url,needStyle)
        sprite.spriteFrame = spriteFrame;
    }

    // 从父节点保存的缓存纹理列表获取指定纹理
    public getSpriteFrameFromParent(url, needStyle){
        var style = cc.sys.localStorage.getItem("mjStyle")
        if (style && needStyle && style == "black")
            url += "_black"

        var gameUIMj = this.node.getParent().getParent().getComponent("GameUI_MJ")
        return gameUIMj.getMjSpriteFrame(url)
    }

    checkIsErrorTuoGuan(){
        if (this.mjData && this.mjData.playerInfoMap.get(0))
        {
            var isTrustee = this.mjData.playerInfoMap.get(0).isTrustee
            if (!isTrustee)
                return
            MessageManager.getInstance().messageSend(Proto.CS_Trustee.MsgID.ID, {isTrustee: false});
        }
    }

}
