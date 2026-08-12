import { Skill } from '../../models/skill'
import { crudHandlers } from '../../utils/crud'

export default crudHandlers(Skill, ['name', 'web', 'intro', 'sort', 'desc', 'remark']).remove
