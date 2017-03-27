# animkit 0.0.4

## Description
- メソッドチェーンでノードに対するclassの付け外しを記述可能にするライブラリ
- jQuery有りきのライブラリで、AMD,CommonJSモジュールに対応

## Release Notes
- 0.0.1 初版
- 0.0.2 delayメソッドに追加
- 0.0.3 animClassメソッドにnowaitとendfilterを追加
- 0.0.4 コメントを追加

## How to use - example
    var testAnim = new Animkit.Animation();
        testAnim
            .animClass('#domid1', 'anime-1')
            .delay(500)
            .animMulti([
                { method:'animClass', node:'#domid1', classname:'anime-2' },
                { method:'animClass', node:'.domclass1', classname:'anime-3', nowait:true }
            ])
            .kick();
- animClassメソッドで、対象のDOMに対象のクラスを設定できます。
- animClassメソッドで設定されたクラスのcssアニメーションが完了すると、次のアニメーションに移ります。（以前に追加したクラスを取り、新たなクラスを設定）
- delayメソッドでミリ秒単位で実行を遅れさせることができます。
- animClassメソッドに、オブジェクトの配列を渡すと、複数のDOMにcssアニメーションを設定できます。
  基本的には全てのcssアニメーションが終わるのを待って次へ進みますが、nowaitを設定すると、そのアニメーションの終了を待たずに次へ進みます。
  endfilterを設定することで、終了条件を変更できます
- kickメソッドで、アニメーションを開始します（定義だけしておいて、任意のタイミングでkick()することが可能です）
- resetメソッドで、アニメーションを最初から開始します。
