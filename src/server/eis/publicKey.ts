import 'server-only'

import { eisPublicKeyOverride } from '@/server/env'

/**
 * EIS public key published on the EIS Certification portal (Downloads → EIS_Certification_Public_Key.txt).
 * It encrypts the Authentication API request. Set EIS_PUBLIC_KEY if BIR issues a different key (for
 * example for production).
 */
export const EIS_CERTIFICATION_PUBLIC_KEY =
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgMbSxoPRLi4P98qbfdFvwYCEf6l2QcKHhyE+m7Fh8OSqKqQFWud0+SSqydzYZzQYZIQ0hwZ/Vvd6StsEY80O7XC6ELVZ052s91PjAlh38TSzmJGy8ZZUYLsg8S2DzKaCpQ0ZmvphYf0ZB8ZoOXBTVPpg4cGBVbMZLdTtnXYxSegXhog6XBsIkAXmAWHwzJ0t6x0NbMnsfbHvFlqtUrsbwBc4BD+0rO3lJHPbDO4HEiMmrlM/bD/hL4uKzXv3jeXCkDbQdYsZZgI7tglu2Al/jB8VdMDJRJjsQf0Z5Ye3FdOsqp1v3SF3ENns8F/0A8xrrB/SuKcwO7Rvm2fjogoqqwIDAQAB'

export const getEisPublicKey = () => eisPublicKeyOverride || EIS_CERTIFICATION_PUBLIC_KEY
