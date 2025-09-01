import { Flex, Icon, Input } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { IoMdStarOutline } from 'react-icons/io'
import { RxCopy } from 'react-icons/rx'
import { SiGooglechrome } from 'react-icons/si'
import { useTabs } from '../../state/tabs'

const AddressBar: React.FC = () => {
  const { activeId, tabs } = useTabs()
  const activeTab = tabs.find((t) => t.id === activeId)
  const [value, setValue] = useState(activeTab?.url ?? '')

  useEffect(() => {
    if (activeTab) setValue(activeTab.url)
  }, [activeTab?.url, activeId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && activeId) {
      const url = value.startsWith('http') ? value : `https://${value}`
      window.tabs.navigate(activeId, url)
    }
  }

  return (
    <Flex h="34px" w="full" pos="relative">
      <Icon pos="absolute" top="8px" left="10px" zIndex={2}>
        <SiGooglechrome color="#737373" size={17} />
      </Icon>
      <Input
        bgColor="#f2f2f2"
        value={value.endsWith('/') ? value.slice(0, -1) : value}
        h="34px"
        pl="32px"
        pb="2px"
        borderRadius="full"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tìm kiếm hoặc nhập một URL"
        w="full"
        color="#404040"
        fontSize={14}
        border="1px solid #ededed"
        _focus={{ outline: 'none' }}
      />

      <Flex
        pos="absolute"
        top="5px"
        right="32px"
        w="24px"
        h="24px"
        align="center"
        justify="center"
        borderRadius="full"
        transitionDuration="200ms"
        _hover={{ bgColor: '#d9d9d9' }}
      >
        <RxCopy size={15} color="#262626" />
      </Flex>

      <Flex
        pos="absolute"
        top="5px"
        right="6px"
        w="24px"
        h="24px"
        align="center"
        justify="center"
        borderRadius="full"
        transitionDuration="200ms"
        _hover={{ bgColor: '#d9d9d9' }}
      >
        <IoMdStarOutline size={18} color="#262626" />
      </Flex>
    </Flex>
  )
}

export default AddressBar
