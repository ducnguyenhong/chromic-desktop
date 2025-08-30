import { Button, Flex, Image, Spinner, Text } from '@chakra-ui/react'
import Logo from '@renderer/assets/logo.webp'
import { useTabs } from '@renderer/state/tabs'
import { AiOutlineClose, AiOutlinePlus } from 'react-icons/ai'

const TabBar: React.FC = () => {
  const { tabs, activeId } = useTabs()

  const handleAddTab = async () => {
    await window.tabs.create('https://www.google.com')
  }

  const handleActivate = async (id: string) => {
    await window.tabs.activate(id)
  }

  const handleClose = async (id: string) => {
    await window.tabs.close(id)
  }

  return (
    <Flex h="38px" bgColor="#e6e6e6" overflowX="auto" userSelect="none" align="flex-end">
      <Flex
        h="38px"
        align="center"
        justify="center"
        px="8px"
        onClick={() => window.tabs.openSettings()}
      >
        <Image src={Logo} w="24px" h="24px" alt="logo" />
      </Flex>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId
        const favicon = `https://www.google.com/s2/favicons?domain=${tab.url.slice(0, -1)}&sz=128`

        console.log('ducnh favicon', favicon)

        return (
          <Flex
            key={tab.id}
            bgColor={isActive ? '#FFF' : '#e6e6e6'}
            gap={2}
            cursor="default"
            userSelect="none"
            px="8px"
            borderRadius={0}
            borderTopRadius={8}
            justify="flex-start"
            align="center"
            h="32px"
            w="200px"
            onClick={() => handleActivate(tab.id)}
          >
            <Flex flex={1}>
              {tab.isLoading && <Spinner size="xs" color="#000" />}

              {tab.isLoading ? (
                <Spinner size="xs" color="#000" />
              ) : (
                <Image src={favicon} w="16px" h="16px" alt="favicon" />
              )}

              <Text lineClamp={1} color="#000" fontWeight={400} fontSize={12}>
                {tab.title || 'New Tab'}
              </Text>
            </Flex>
            {tabs.length > 1 && (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  handleClose(tab.id)
                }}
                style={{ marginLeft: '8px', display: 'inline-flex' }}
              >
                <AiOutlineClose color="#000" size={14} />
              </span>
            )}
          </Flex>
        )
      })}
      <Button size="sm" variant="outline" cursor="default" onClick={handleAddTab}>
        <AiOutlinePlus />
      </Button>
      <Flex
        flex={1}
        h="38px"
        cursor="grab"
        style={{
          WebkitAppRegion: 'drag'
        }}
      />
    </Flex>
  )
}

export default TabBar
