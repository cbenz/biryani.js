import debug from "debug"


export const createLogger = (name) => debug("biryani.js:" + name)

export const inspect = (logger) => (...args) => logger(...args.map(JSON.stringify))
