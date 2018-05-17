import Vue from "vue";
import { noop, alwaysTrue } from "./utils";

export function wrap(wrappedComponent, options, resourceInfoParam) {

    const resourceInfo = {}
    for (let key in resourceInfoParam) {
        resourceInfo[key] = {
            url: resourceInfoParam[key]["url"],
            validate: resourceInfoParam[key]["validate"] || alwaysTrue
        }
    }

    const { network, validate, mutate } = options

    const urls = {}
    for (let key in resourceInfo) {
        urls[key] = resourceInfo[key].url
    }

    const resources = {}
    for (let key in resourceInfo) {
        resources[key] = null
    }

    return Vue.extend({
        render(h, ctx) {
            const props = {}
            for (let key in this.resource) {
                props[key] = this.resource[key]
            }
            return h(wrappedComponent, { props })
        },
        data: () => ({
            url: urls,
            resource: resources
        }),
        // watch: {
        //     url: {
        //         handler: function() {
        //
        //         },
        //         deep: true
        //     }
        // },
        mounted() {
            for (let key in resourceInfo) {
                this.load(key)
            }
        },
        methods: {
            load(key) {
                const invoke = this.$children[0].$resourceDelegate

                invoke(this.$children[0].$options.beforeLoad)  // ライフサイクルフックをresourceInfoParamに移動
                Promise.resolve(network(resourceInfo[key].url)).then(response => {
                    if (validate(response)) {
                        return Promise.resolve(mutate(response))
                    } else {
                        invoke(this.$children[0].$options.failed, "Global validation error")
                    }
                }).then(result => {
                    if (resourceInfo[key].validate(result)) {
                        this.resource[key] = result
                        invoke(this.$children[0].$options.loaded, result)
                    } else {
                        invoke(this.$children[0].$options.failed, "Response validation error")
                    }
                }).catch(e => {
                    console.log(e)
                    invoke(this.$children[0].$options.failed, "Unexpected error", e)
                })
            }
        },
        components: {
            wrappedComponent
        }
    })
}
