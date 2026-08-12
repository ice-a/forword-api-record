import { Vpn } from '../../models/vpn'
import { crudHandlers } from '../../utils/crud'

export default crudHandlers(Vpn, ['name', 'url', 'desc', 'sort', 'remark']).remove
