import { Button, HStack, Spinner, Text } from '@chakra-ui/react'
import { AiOutlineClose, AiOutlinePlus } from 'react-icons/ai'
import { useTabs } from '../../state/tabs'

const TabBar: React.FC = () => {
  const { tabs, activeId } = useTabs()

  const handleAddTab = async () => {
    await window.tabs.create('https://www.google.com')
    // không gọi addTab ở đây; sẽ nhận qua window.tabs.onCreated
  }

  const handleActivate = async (id: string) => {
    await window.tabs.activate(id)
    // state.activeId sẽ được sync qua window.tabs.onActivated
  }

  const handleClose = async (id: string) => {
    await window.tabs.close(id)
    // state sẽ được sync qua window.tabs.onClosed
  }

  console.log('ducnh tabstabs', tabs)

  return (
    <HStack spacing={2} px={2} py={1} bg="gray.100" overflowX="auto">
      {tabs.map((tab) => {
        console.log('tab render', tab.id, tab.title, tab.isLoading)
        return (
          <Button
            key={tab.id}
            size="sm"
            variant={tab.id === activeId ? 'solid' : 'ghost'}
            onClick={() => handleActivate(tab.id)}
            display="flex"
            alignItems="center"
            gap={2}
          >
            {/* Nếu tab đang loading thì hiện spinner nhỏ */}
            {tab.isLoading && <Spinner size="xs" mr={1} color="red" />}

            <Text lineClamp={1} maxW="120px">
              {tab.title || 'New Tab'}
            </Text>

            <span
              onClick={(e) => {
                e.stopPropagation()
                handleClose(tab.id)
              }}
              style={{ marginLeft: '8px', display: 'inline-flex' }}
            >
              <AiOutlineClose />
            </span>
          </Button>
        )
      })}

      <Button size="sm" variant="outline" onClick={handleAddTab}>
        <AiOutlinePlus />
      </Button>
    </HStack>
  )
}

export default TabBar
