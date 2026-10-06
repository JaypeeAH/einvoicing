import navigationConfig from '@/configs/navigation.config'
import type { NavigationTree } from '@/@types/navigation'

const flatten = (tree: NavigationTree[]): NavigationTree[] => tree.flatMap((node) => [node, ...flatten(node.subMenu)])

const items = flatten(navigationConfig).filter((node) => node.type === 'item')

/** Navigation entry for a URL: the entry with the longest path that prefixes the pathname. */
export default function queryRoute(
    pathname: string | null | undefined,
): Pick<NavigationTree, 'key'> & Partial<NavigationTree> {
    const path = pathname || '/'
    const match = items
        .filter((item) => (item.path === '/' ? path === '/' : path === item.path || path.startsWith(`${item.path}/`)))
        .sort((a, b) => b.path.length - a.path.length)[0]
    return match || { key: '' }
}
