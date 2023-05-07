const { ccclass, property } = cc._decorator;

@ccclass
export class NodeMoveUpAndDown extends cc.Component {
    onLoad() 
    {
        var action0 = cc.moveBy(1.3, 0, 5);
        var action1 = cc.moveBy(1.3, 0, -5);
        this.node.runAction(cc.repeatForever(cc.sequence(action1,action0)));
    }
}