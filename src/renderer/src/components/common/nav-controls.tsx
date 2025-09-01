import { Flex } from '@chakra-ui/react'
import { IoArrowBack, IoArrowForward } from 'react-icons/io5'
import { TbReload } from 'react-icons/tb'
import { useTabs } from '../../state/tabs'

const NavControls: React.FC = () => {
  const { activeId } = useTabs()

  return (
    <Flex px={2}>
      <Flex
        align="center"
        justify="center"
        w="34px"
        h="34px"
        minW={0}
        minH={0}
        bgColor="#FFF"
        borderRadius="full"
        cursor="default"
        _hover={{ bgColor: '#f2f2f2' }}
        transitionDuration="250ms"
        onClick={() => activeId && window.tabs.back(activeId)}
      >
        <IoArrowBack color="#4f4f4f" size={18} />
      </Flex>
      <Flex
        align="center"
        justify="center"
        w="34px"
        h="34px"
        minW={0}
        minH={0}
        bgColor="#FFF"
        borderRadius="full"
        cursor="default"
        _hover={{ bgColor: '#f2f2f2' }}
        transitionDuration="250ms"
        onClick={() => activeId && window.tabs.forward(activeId)}
      >
        <IoArrowForward color="#4f4f4f" size={18} />
      </Flex>
      <Flex
        align="center"
        justify="center"
        w="34px"
        h="34px"
        minW={0}
        minH={0}
        bgColor="#FFF"
        borderRadius="full"
        cursor="default"
        _hover={{ bgColor: '#f2f2f2' }}
        transitionDuration="250ms"
        onClick={() => activeId && window.tabs.reload(activeId)}
      >
        <TbReload color="#4f4f4f" size={16} />
      </Flex>
    </Flex>
  )
}

export default NavControls
