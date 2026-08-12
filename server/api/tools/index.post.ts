import { Tool } from '../../models/tool'
import { crudHandlers } from '../../utils/crud'

export default crudHandlers(Tool, ['name', 'desc', 'tags', 'install', 'home', 'detail', 'sort', 'remark']).create
