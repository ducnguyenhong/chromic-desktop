import { Flex, Image } from '@chakra-ui/react'
import Logo from '@renderer/assets/logo.webp'
import { useTabs } from '@renderer/state/tabs'
import { HOME_PAGE_URL } from '@renderer/utils/const'
import { IoAdd } from 'react-icons/io5'
import TabItem from './tab-item'

const TabBar: React.FC = () => {
  const { tabs } = useTabs()

  const handleAddTab = async () => {
    await window.tabs.create(HOME_PAGE_URL)
  }

  return (
    <Flex h="38px" bgColor="#e6e6e6" overflowX="auto" userSelect="none" align="flex-end">
      <Flex
        h="38px"
        align="center"
        justify="center"
        pr="9px"
        pl="8px"
        onClick={() => window.tabs.openSettings()}
      >
        <Image src={Logo} w="23px" h="23px" alt="logo" />
      </Flex>

      {tabs.map((tab, tabIndex) => (
        <TabItem item={tab} key={tab.id} index={tabIndex} />
      ))}

      <Flex
        pos="relative"
        top="-2px"
        left="2px"
        zIndex={100}
        w="32px"
        h="32px"
        align="center"
        justify="center"
        cursor="default"
        title="New tab"
        onClick={handleAddTab}
      >
        <Flex
          w="25px"
          h="25px"
          borderRadius="full"
          align="center"
          justify="center"
          transitionDuration="200ms"
          _hover={{ bgColor: '#CCC' }}
        >
          <IoAdd
            color="#1a1a1a"
            size={16}
            style={{ position: 'relative', top: '1px', left: '1px' }}
          />
        </Flex>
      </Flex>
      <Flex
        flex={1}
        h="38px"
        cursor="grab"
        style={
          {
            WebkitAppRegion: 'drag'
          } as React.CSSProperties
        }
      />
    </Flex>
  )
}

export default TabBar
