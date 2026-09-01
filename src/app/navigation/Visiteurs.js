import DashboardsIcon from 'assets/dualicons/dashboards.svg?react'
import { NAV_TYPE_ROOT } from 'constants/app.constant'

export const dashboards = {
    id: 'dashboards',
    type: NAV_TYPE_ROOT,
    path: '/visiteur',
    title: 'Visiteur',
    transKey: 'nav.dashboards.dashboards',
    Icon: DashboardsIcon,
    childs: [
        {
            // id: 'dashboards.home',
            // path: path(ROOT_DASHBOARDS, '/home'),
            // type: NAV_TYPE_ITEM,
            // title: 'Home',
            // transKey: 'nav.dashboards.home',
            // Icon: HomeIcon,
        },

    ]
}
