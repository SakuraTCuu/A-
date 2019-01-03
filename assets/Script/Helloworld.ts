const { ccclass, property } = cc._decorator;

class np {
    x: number = null;
    y: number = null;
    parent: np = null;
    G: number = null;
    H: number = null;
    F: number = this.G + this.H;
    isRepet: boolean = false;
    constructor(x: number, y: number, parent: np) {
        this.x = x;
        this.y = y;
        this.parent = parent;
    }

    CalcF() {
        this.F = this.G + this.H;
    }
}

/**
 * create by Sakura at 12/29
 * A* 寻路算法 
 */
@ccclass
export default class Helloworld extends cc.Component {

    @property
    gx: number = 20;

    _grap: cc.Graphics = null;

    //目标节点  结束点
    _targetPoint: cc.Vec2 = cc.v2(12, 8);

    //开始点
    _startPoint: cc.Vec2 = cc.v2(8, 8);


    _barrier: object = {};

    //障碍物集合
    _barrierList: Array<cc.Vec2> = new Array();

    _path: Array<cc.Vec2> = new Array();

    moveType: number = 0;

    start() {
        this.initMap();
        this.initEvent();
    }

    /**
     * 初始化地图
     * ccGraphics 绘制地图
     */
    initMap() {
        this._grap = this.node.addComponent(cc.Graphics);

        this.drawAll();
    }

    initEvent() {
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
    }

    testOpenList: Array<np> = [];
    testCloseList: Array<np> = [];

    findPath(startPos: np, endPos: np, isIgnoreCorner: boolean) {
        this.testOpenList.push(startPos);
        let count = 0;
        while (this.testOpenList.length != 0) {
            count++;
            if (count >= 5000) {
                cc.log('超出搜索上限');
                return;
            }
            //找出F值最小的点
            let tempStart = this.findMinF();
            //openlist里删除
            //close里添加
            this.testCloseList.push(tempStart);
            let roundList = this.findRoundNode(tempStart, isIgnoreCorner);

            for (let i = 0; i < roundList.length; i++) {
                let temp = roundList[i];
                if (this.openListExists(temp.x, temp.y)) {
                    //计算G值, 如果比原来的大, 就什么都不做, 否则设置它的父节点为当前点,并更新G和F
                    this.FoundPoint(tempStart, temp);
                } else {
                    //如果它们不在开始列表里, 就加入, 并设置父节点,并计算GHF
                    this.NotFoundPoint(tempStart, endPos, temp);
                }
            }
            //判断是否到达终点
            let p = this.isEnd(endPos);
            if (p) {
                //到达终点
                return p;
            }
        }
        return this.isEnd(endPos);
    }

    isEnd(endPos: np): any {
        for (let i = 0; i < this.testOpenList.length; i++) {
            let temp = this.testOpenList[i];
            if (temp.x === endPos.x && temp.y === endPos.y) {
                return temp;
            }
        }
        return false;
    }

    FoundPoint(start: np, temp: np): void {
        //计算G值
        let G = cc.pDistance(cc.v2(start.x, start.y), cc.v2(temp.x, temp.y));
        G = start.G + G;
        if (G < temp.G) {
            temp.parent = start;
            temp.G = G;
            temp.CalcF();
        }
    }

    NotFoundPoint(start: np, end: np, temp: np): void {
        temp.parent = start;
        temp.G = this.CalcG(start, temp);
        temp.H = this.CalcH(end, temp);
        temp.CalcF();
        this.testOpenList.push(temp);
    }

    CalcH(end: np, point: np): number {
        let H = Math.abs(end.x - point.x) + Math.abs(end.y - point.y);
        return H;
    }

    CalcG(start: np, temp: np): number {
        let G = cc.pDistance(cc.v2(start.x, start.y), cc.v2(temp.x, temp.y));
        G = G + start.G;
        return G;
    }

    /**
     *  查找最小F
     */
    findMinF(): np {
        let index = 0;
        for (let i = 0; i < this.testOpenList.length; i++) {
            let temp = this.testOpenList[i];
            if (i >= 1) {
                if (temp.F <= this.testOpenList[index].F) {
                    index = i;
                }
            }
        }
        let minF = this.testOpenList.splice(index, 1)[0]
        return minF;
    }

    /**
     * 寻找四周的节点
     */
    findRoundNode(point: np, isIgnoreCorner: boolean): Array<np> {
        let roundList: Array<np> = new Array();
        for (let x = point.x - 1; x <= point.x + 1; x++) {
            for (let y = point.y - 1; y <= point.y + 1; y++) {
                // cc.log();
                if (this.CanReach(point, x, y, isIgnoreCorner)) {
                    let temp = new np(x, y, point);
                    roundList.push(temp);
                }
            }
        }
        return roundList;
    }

    /**
     *  是否是有效的四/八方向节点
     * @param start 
     * @param x 
     * @param y 
     * @param IsIgnoreCorner 
     */
    CanReach(start: np, x: number, y: number, IsIgnoreCorner: boolean) {
        if (this.barrierExists(x, y) || this.CloseExists(x, y) || this.openListExists(x, y)) {
            return false;
        } else {
            if (Math.abs(x - start.x) + Math.abs(y - start.y) == 1) {
                return true;
            } else { //如果是斜方向移动, 判断是否 "半角"
                if (this.barrierExists(Math.abs(x - 1), y) && this.barrierExists(x, Math.abs(y - 1))) {
                    return true;
                } else {
                    return IsIgnoreCorner;
                }
            }
        }
    }

    /**
     * 已存在的数组判断
     * @param x 
     * @param y 
     */
    openListExists(x, y) {
        for (let i = 0; i < this.testOpenList.length; i++) {
            let temp = this.testOpenList[i];
            if (temp.x === x && temp.y === y) {
                return true;
            }
        }
        return false;
    }

    /**
     * 障碍物判断
     * @param x 
     * @param y 
     */
    barrierExists(x, y) {
        for (const bar in this._barrier) {
            let temp = this._barrier[bar];
            if (temp && temp.x === x && temp.y === y) {
                return true;
            }
        }
        return false;
    }

    /**
     * 闭合数组里
     */
    CloseExists(x, y) {
        for (let i = 0; i < this.testCloseList.length; i++) {
            let temp = this.testCloseList[i];
            if (temp.x === x && temp.y === y) {
                return true;
            }
        }
        return false;
    }

    onMouseDown(e: cc.Event.EventTouch) {
        const { x, y } = e.getLocation();
        //坐标 映射 map
        let map = this.pixel2Map(x, y);

        if (this._startPoint.x === map.x && this._startPoint.y === map.y) {
            this.moveType = 3; //更改开始点
        } else if (this._targetPoint.x === map.x && this._targetPoint.y === map.y) {
            this.moveType = 4; //更改结束点
        } else if (!this._barrier[map.x + "_" + map.y]) {
            this.moveType = 1; //添加
        } else {
            this.moveType = 2; //清除
        }

        this.node.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
        this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.testOpenList.length = 0;
        this.testCloseList.length = 0;
    }

    onMouseUp() {
        this.node.off(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
        this.node.off(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.moveType = 0;

        let start = new np(this._startPoint.x, this._startPoint.y, null);
        let end = new np(this._targetPoint.x, this._targetPoint.y, null);
        let path = this.findPath(start, end, false);
        cc.log('path--->>', path)
        if (path) {
            this.drawAll(path);
        } else {
            this.drawAll();
        }
    }

    onMouseMove(event: cc.Event.EventTouch) {
        //获取移动的距离  给这些节点增加颜色  充当障碍物;
        const { x, y } = event.getLocation();
        //坐标 映射 map
        let map = this.pixel2Map(x, y);
        //排除俩坐标
        let id = map.x + "_" + map.y;
        if (this.moveType === 1) {
            if (!this._barrier[id]) {
                if (this.equalTwoPoint(map, cc.v2(this._startPoint.x, this._startPoint.y)) || this.equalTwoPoint(map, cc.v2(this._targetPoint.x, this._targetPoint.y))) {
                } else {
                    this._barrier[id] = map;
                }
            }
        } else if (this.moveType === 2) {
            if (this._barrier[id]) {
                this._barrier[id] = null;
            }
        } else if (this.moveType === 3) {
            if (!this._barrier[id]) {
                this._startPoint.x = map.x;
                this._startPoint.y = map.y;
            }
        }
        else if (this.moveType === 4) {
            if (!this._barrier[id]) {
                this._targetPoint.x = map.x;
                this._targetPoint.y = map.y;
            }
        }
        this.drawAll();
    }

    /**
     * 根据每一次的动作  画 
     */
    drawAll(path = null): void {
        this._grap.clear();
        this._grap.lineWidth = 1;
        let r = new cc.Rect(cc.view.getVisibleOrigin().x, cc.view.getVisibleOrigin().y, cc.view.getVisibleSize().width, cc.view.getVisibleSize().height)
        let zx = 0;
        let yx = Math.ceil(r.width / this.gx);
        let zy = 0;
        let yy = Math.ceil(r.height / this.gx);

        this.fillRect(cc.color(255, 255, 255), r.x, r.y, r.width, r.height);
        this.fillRect(cc.color(0, 255, 100), this.gx * this._startPoint.x, this.gx * this._startPoint.y, this.gx, this.gx);
        this.fillRect(cc.color(255, 0, 0), this.gx * this._targetPoint.x, this.gx * this._targetPoint.y, this.gx, this.gx);

        for (let i = zy; i < yy; i++) {
            for (let a = zx; a < yx; a++) {
                if (this._barrier[a + "_" + i] != null) {
                    this.fillRect(cc.color(100, 100, 100), this.gx * a, this.gx * i, this.gx, this.gx);
                }
                this._grap.strokeColor = cc.color(150, 150, 150);
                this._grap.rect(this.gx * a, this.gx * i, this.gx, this.gx);
                this._grap.stroke();

                // let no = new cc.Node();
                // no.color = cc.Color.BLACK;
                // let lab = no.addComponent(cc.Label);
                // lab.fontSize = 10;
                // lab.string = a + "_" + i;
                // this.node.addChild(no);
                // no.position = cc.v2(this.gx * a + this.gx / 2, this.gx * i);
            }
        }

        if (path) {
            let b = this.gx / 2;

            this._grap.moveTo(path.x * this.gx + b, path.y * this.gx + b);

            while (path != null) {
                // cc.log(path.x + ", " + path.y);
                this._grap.strokeColor = cc.Color.BLUE;
                this._grap.lineWidth = 3;
                this._grap.lineTo(path.x * this.gx + b, path.y * this.gx + b);
                this._grap.stroke();

                this._grap.moveTo(path.x * this.gx + b, path.y * this.gx + b);
                path = path.parent;
            }
        }

        // if (this.path && this.path.length > 1) {
        //     this.path.push(this._targetPoint); //添加起始点
        //     this.path.unshift(this._startPoint); //添加结束点
        //     let b = this.gx / 2;
        //     let p = new Array(this.path.length);
        //     this._grap.strokeColor = cc.Color.BLUE;
        //     this._grap.moveTo(this.path[0].x * this.gx + b, this.path[0].y * this.gx + b);
        //     for (let i = 1; i < p.length; i++) {
        //         this._grap.lineTo(this.path[i].x * this.gx + b, this.path[i].y * this.gx + b);
        //     }
        //     this._grap.stroke();
        // }
    }

    fillRect(col: cc.Color, x: number, y: number, w: number, h: number) {
        this._grap.rect(x, y, w, h);
        this._grap.fillColor = col;
        this._grap.fill();
    }

    /**
     * 像素转map
     */
    pixel2Map(x: number, y: number): cc.Vec2 {
        let px = Math.floor(x / this.gx);
        let py = Math.floor(y / this.gx);
        return cc.v2(px, py);
    }

    /**
     * map 转像素
     */
    map2Pixel(x: number, y: number): cc.Vec2 {
        let mx = x * this.gx;
        let my = y * this.gx;
        return cc.v2(mx, my);
    }

    /**
     * 判断绘制点是否和开始结束点是否相同
     */
    equalTwoPoint(map: cc.Vec2, other: cc.Vec2) {
        return map.equals(other);
    }
}
