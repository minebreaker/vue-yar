const gulp = require("gulp")
const rollup = require("rollup")
const rollupAlias = require("rollup-plugin-alias")
const rollupNodeResolve = require("rollup-plugin-node-resolve")
const rollupTypescript = require("rollup-plugin-typescript2")
const rollupReplace = require("rollup-plugin-replace")
const rimraf = require("rimraf")
const karma = require("karma")

const config = {
    // TypeScriptソース
    srcDir: "src",
    srcTestDir: "test",
    // ビルド出力先
    buildBase: "build",
    rollupDest: "build/rollup",
    rollupTestDest: "build/rollupTest",
    test: "build/test",
    distribution: "dist",
    development: true
}

// 出力先をクリンナップ
gulp.task("clean", () => {
    return new Promise(() => {
        rimraf.sync(`${config.buildBase}/*`)
        rimraf.sync(`${config.distribution}/*`)
    })
})

// rollup
gulp.task("rollup", () => {
    return rollup.rollup({
        input: `${config.srcDir}/vue-yar.ts`,
        plugins: [
            rollupTypescript(),
            rollupAlias({
                // vue: "node_modules/vue/dist/vue.esm.js"
            })
        ]
    }).then(bundle =>
        bundle.write({
            file: `${config.rollupDest}/vue-yar.js`,
            format: "es",
            sourcemap: config.development
        })
    )
})

// テストファイル rollup
gulp.task("rollup-test", ["rollup"], () => {
    return rollup.rollup({
        input: `${config.srcTestDir}/sample.js`,
        plugins: [
            rollupTypescript(),
            rollupAlias({
                vue: "node_modules/vue/dist/vue.esm.js"
            }),
            rollupReplace({ "process.env.NODE_ENV": JSON.stringify("development") })
            // rollupNodeResolve()
        ]
    }).then(bundle => {
        return bundle.write({
            file: `${config.rollupTestDest}/sample.js`,
            format: "iife",
            name: "main",
            sourcemap: config.development
        })
    })
})

gulp.task("copy", ["rollup"], () => {
    return gulp.src(`${config.rollupDest}/vue-yar.js`)
        .pipe(gulp.dest(config.distribution))
})

gulp.task("copy-test", ["rollup", "rollup-test"], () => {
    return gulp.src([
        `${config.rollupTestDest}/*.js`
    ]).pipe(gulp.dest("test-files"))
})

// ビルド
gulp.task("assemble", ["rollup", "copy", "copy-test"])
gulp.task("build", ["rollup", "rollup-test", "copy", "copy-test"])
gulp.task("default", ["build"])

gulp.doneCallback = (error) => {
    // テスト実行時、Karmaかnodeのバグで、コネクションが生きているのかプロセスが終了しない
    // タスク完了時のコールバックで、強制的にプロセスを終了する
    process.exit(error ? -1 : 0)
}
