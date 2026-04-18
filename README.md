# playback-speed-chrome-extension

Youtubeなど動画の再生速度をコマンドで変更できるようにするChrome拡張機能です。

# Features

- コマンドで簡単に再生速度を変更可能
- 再生速度を `chrome.storage.local` に保存
- 動画要素が動的に入れ替わるページでも再検出して速度を適用
- 一部サイトが再生速度を上書きした場合も、保存済み速度を再適用

# Supported Sites

- YouTube (`www.youtube.com`)
- Netflix (`www.netflix.com`)
- Amazon (`www.amazon.co.jp`)
- Prime Video (`www.primevideo.com`)

# Command

- a : 0.1倍再生速度を遅くする
- s : 1倍速にする
- d : 0.1倍再生速度を早くする

# Notes

- 速度変更は 0.1 刻み、最小 0.1x、最大 10.0x
- `a` / `d` / `s` 以外のキー入力時は速度インジケーターを非表示
