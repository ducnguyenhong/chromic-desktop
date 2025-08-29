import { Button, HStack } from '@chakra-ui/react'
import { AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineReload } from 'react-icons/ai'
import { useTabs } from '../../state/tabs'

const NavControls: React.FC = () => {
  const { activeId } = useTabs()

  return (
    <HStack spacing={2} px={2} py={1} bg="gray.50">
      <Button size="sm" onClick={() => activeId && window.tabs.back(activeId)}>
        <AiOutlineArrowLeft />
      </Button>
      <Button size="sm" onClick={() => activeId && window.tabs.forward(activeId)}>
        <AiOutlineArrowRight />
      </Button>
      <Button size="sm" onClick={() => activeId && window.tabs.reload(activeId)}>
        <AiOutlineReload />
      </Button>
    </HStack>
  )
}

export default NavControls
