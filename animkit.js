// animkit.js 0.0.4
// author:Masao Okamoto
// 0.0.1 初版
// 0.0.2 delayメソッドに追加
// 0.0.3 animClassメソッドにnowaitとendfilterを追加
// 0.0.4 コメントを追加

// how to use - example
// var testAnim = new Animkit.Animation();
//     testAnim
//         .animClass('#domid1', 'anime-1')
//         .delay(500)
//         .animMulti([
//             { method:'animClass', node:'#domid1', classname:'anime-2' },
//             { method:'animClass', node:'.domclass1', classname:'anime-3', nowait:true }
//         ])
//         .kick();

(function(root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'exports'], function($, exports) {
            root.Animkit = factory(root, exports, $);
        });

    } else if (typeof exports !== 'undefined') {
        factory(root, exports);

    } else {
        root.Animkit = factory((root, {}, (root.jQuery || root.Zepto || root.ender || root.$)));
    }

}(this, function(root, Animkit, $){
    var previousAnimkit = root.Animkit;

    Animkit.$ = $;

    Animkit.noConflict = function() {
        root.Animkit = previousAnimkit;
        return this;
    };

    Animkit._nodes = {};

//TODO: select vendor prefix.
    var vendorPrefix = (/webkit/i).test(navigator.appVersion) ? 'webkit' :
                       (/firefox/i).test(navigator.userAgent) ? '' :
                       (/trident/i).test(navigator.userAgent) ? 'MS' :
                       'opera' in window ? 'o' : '';
    Animkit.getAnimationEvent = function( ename ) {
        return (vendorPrefix == '' || vendorPrefix == 'o') ? (vendorPrefix + ename).toLowerCase() : vendorPrefix + ename;
    }
    Animkit._ANIMATIONEND = Animkit.getAnimationEvent('AnimationEnd', vendorPrefix);
    Animkit._ANIMATIONITERATION = Animkit.getAnimationEvent('AnimationIteration', vendorPrefix);
    Animkit._TRANSITIONEND = Animkit.getAnimationEvent('TransitionEnd', vendorPrefix);

    // get $object and keep.
    Animkit.getNode =  function ( selector ) {
//TODO: multi node.
        if (typeof selector === 'undefined') {
            return [];
        }

        if (typeof this._nodes[selector] === 'undefined' ) {
            this._nodes[selector] = $(selector);
        }

        return this._nodes[selector];
    };

    var Animation = Animkit.Animation = function() {
        this.animObjArray = undefined;
        this.animObjArrayMaster = [];
        this.isRepeat = false;
        this.catchEventsMaster = [Animkit._ANIMATIONEND, Animkit._TRANSITIONEND];
        this.catchEvents = this.catchEventsMaster.join(' ')

        this.initialize.apply(this, arguments);
    };

//TODO: for canvas animation
//TODO: for jquery.enqt or jquery.toolkit animation
    $.extend(Animation.prototype, {

        // 複数のお仕事を同時に指定(アニメーション定義)
        animMulti: function(animArr){
            for (var i=0; i<animArr.length; i++) {
                if (typeof animArr[i].node === 'string') {
                    animArr[i].node = Animkit.getNode(animArr[i].node);
                }
            }
            this.animObjArrayMaster.push(animArr);

            return this;
        },

        // 要素にクラスを設定して、animationEndを待つ簡単なお仕事(アニメーション定義)
        // node      : セレクタ(string) or jQueryオブジェクト ※単一要素であること
        // classname : 設定するクラス名(string)
        // callback  : アニメーション終了時に実行する関数(function)
        // endfilter : 終了判定の詳細指定(object) 例:{animationName:'キーフレーム名'} (webkitAnimationEndイベントオブジェクト内のプロパティと比較する)
        // nowait    : 待機フラグ(boolean) trueで終了を待たずに次の処理を実行
        animClass: function(node, classname, callback, endfilter, nowait) {
            if (typeof node === 'string') {
                node = Animkit.getNode(node);
            }

            if (arguments.length == 4) {
                if (typeof callback !== 'function') { // callback省略
                    nowait = endfilter; // boolean
                    endfilter = $.extend(true, {}, callback); // object
                    callback = undefined;
                } else if (typeof endfilter === 'boolean') { // endfilter省略
                    nowait = endfilter;
                    endfilter = undefined;
                }
            } else if (arguments.length == 3) {
                if (typeof callback === 'object') {
                    endfilter = $.extend(true, {}, callback); // object
                    callback = undefined;
                } else if (typeof callback === 'boolean') {
                    nowait = callback;
                    callback = undefined;
                }
            }

            this.animObjArrayMaster.push([{
                method:'animClass',
                node:node,
                classname:classname,
                callback:callback,
                endfilter:endfilter,
                nowait:nowait
            }]);

            return this;
        },

        // 待機(次のkick()でアニメーション再開)(アニメーション定義)
        // callback  : 同時に実行する関数 (function)
        pause: function(callback) {
            this.animObjArrayMaster.push([{
                method:'pause',
                callback:callback
            }]);

            return this;
        },

        // 一定時間待つ(アニメーション定義)
        // time      : 待つ時間(ミリ秒) (int)
        // callback  : 終了時に実行する関数 (function)
        delay: function(time, callback) {
            this.animObjArrayMaster.push([{
                method:'delay',
                time:time,
                callback:callback
            }]);

            return this;
        },

        // 内部関数
        runAnimClass: function(node, classname, callback, endfilter, nowait) {
            var def = $.Deferred();

            if (typeof node.data('_animclass') !== 'undefined') {
                node.removeClass(node.data('_animclass'));
                node.removeData('_animclass');
            }

            if (!nowait) {
                node.on(this.catchEvents, function(e) {
                    var conditionKeys;
                    if (typeof endfilter !== 'undefined') {
                        conditionKeys = Object.keys(endfilter);
                        for (var i=0; i<conditionKeys.length; i++) {
                            if (e.originalEvent[conditionKeys] != endfilter[conditionKeys]) {
                                return;
                            }
                        }
                    }

                    def.resolve();
                    $(this).off(this.catchEvents, arguments.callee);
                    if (typeof callback !== 'undefined') {
                        callback.apply(this);
                    }
                })
                .data('_animclass', classname)
                .addClass(classname);
            } else {
                node.data('_animclass', classname)
                .addClass(classname);
                def.resolve();
                if (typeof callback !== 'undefined') {
                    callback.apply(this);
                }
            }

            return def.promise();
        },

        // 内部関数
        runDelay: function(time, callback) {
            var def = $.Deferred();

            setTimeout(function(){
                def.resolve();
                if (typeof callback !== 'undefined') {
                    callback.apply(this);
                }
            }, time);

            return def.promise();
        },

        // アニメーション開始
        // callback  : 終了時に実行する関数 (function)
        kick: function(callback) {
            var animObj, whenArray = [], that = this;
            if ( (this.isRepeat && this.animObjArray.length == 0) || typeof this.animObjArray === 'undefined' ) this.reset();
            animObj = this.animObjArray.shift();
            console.count('Animkit');
            console.log(animObj);
            if (typeof animObj === 'undefined') {
                if (typeof callback === 'function') {
                    callback.apply(this);
                }
                return [];
            }
            for (var i=0; i<animObj.length; i++) {
                switch(animObj[i].method) {
                    case 'animClass':
                        whenArray.push(this.runAnimClass(animObj[i].node, animObj[i].classname, animObj[i].callback, animObj[i].endfilter, animObj[i].nowait));
                        break;
                    case 'delay':
                        whenArray.push(this.runDelay(animObj[i].time, animObj[i].callback));
                        break;
                    case 'pause':
                        whenArray = [];
                        if (typeof animObj[i].callback === 'function') {
                                animObj[i].callback();
                        }
                        break;
                }
            }

            if (whenArray.length > 0) {
                $.when.apply(null, whenArray).done(function(){
                    //if (typeof callback === 'function') {
                    //    callback.apply(this);
                    //}
                    that.kick(callback);
                });
            } else {
                if (typeof callback === 'function') {
                    callback.apply(this);
                }
            }

            return this;
        },

        // アニメーションの状態をリセット(最初から)
        reset: function() {
            this.animObjArray = [];
            $.extend(true, this.animObjArray, this.animObjArrayMaster);

            return this;
        },

        // アニメーション定義をクリア
        clearAnimation: function() {
            this.animObjArrayMaster = [];

            return this;
        },

        // 繰り返し再生
        setRepeat: function(val) {
            if (val) this.isRepeat = true;
            else this.isRepeat = false;

            return this;
        },

        // animationEndの他に、iterationEndでも終了と判定
        setCatchIterationEnd: function(val) {
            if (val) {
                for (var i=0; i<this.catchEventsMaster.length; i++) {
                    if (this.catchEventsMaster[i] == Animkit._ANIMATIONITERATION) {
                        return this;
                    }
                }
                this.catchEventsMaster.push(Animkit._ANIMATIONITERATION);
                this.catchEvents = this.catchEventsMaster.join(' ');

            } else {
                for (var i=0; i<this.catchEventsMaster.length; i++) {
                    if (this.catchEventsMaster[i] == Animkit._ANIMATIONITERATION) {
                        this.catchEventsMaster.splice(i, 1);
                        this.catchEvents = this.catchEventsMaster.join(' ');
                        return this;
                    }
                }
            }

            return this;
        },

        // 内部関数(初期化処理、特に何もしてない)
        initialize: function(){}
    });

    return Animkit;

}));
