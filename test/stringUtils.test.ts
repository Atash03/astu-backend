import { camel2DbFormat, dbFormat2Camel } from '@/lib/stringUtils'

describe('String Utils', () => {

  describe('dbFormat2Camel', () => {
    it('Should conver camel to db format', async () => {
      const res = camel2DbFormat('thisIsMyTestString')
      expect(res).toBe('this_is_my_test_string')
    })
  })

  describe('dbFormat2Camel', () => {
    it('Should conver db format to camel case', async () => {
      const res = dbFormat2Camel('this_is_my_test_string')
      expect(res).toBe('thisIsMyTestString')
    })
  })  
})
