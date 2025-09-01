import { Box, Flex } from '@chakra-ui/react'
import { FiDownload } from 'react-icons/fi'
import { HiOutlineDotsVertical } from 'react-icons/hi'
import AddressBar from './components/common/address-bar'
import NavControls from './components/common/nav-controls'
import TabBar from './components/tab-bar/tab-bar'
import Tools from './components/tools/tools'

const App: React.FC = () => {
  return (
    <Box h="100vh" w="full">
      <TabBar />
      <Flex mt="6px" w="full" bgColor="#FFF" pr="8px" align="center">
        <NavControls />
        <Flex flex={1}>
          <AddressBar />
        </Flex>
        <Flex
          ml="8px"
          w="32px"
          h="32px"
          align="center"
          justify="center"
          borderRadius="full"
          transitionDuration="200ms"
          _hover={{ bgColor: '#f2f2f2' }}
        >
          <FiDownload size={18} color="#262626" />
        </Flex>
        <Flex
          ml="4px"
          w="32px"
          h="32px"
          align="center"
          justify="center"
          borderRadius="full"
          transitionDuration="200ms"
          _hover={{ bgColor: '#f2f2f2' }}
        >
          <HiOutlineDotsVertical size={19} color="#262626" />
        </Flex>
      </Flex>
      <Flex
        h="40px"
        bgColor="#FFF"
        align="center"
        justify="space-between"
        borderBottom="1px solid #e6e6e6"
      >
        a
        <Tools />
      </Flex>
    </Box>
  )
}

export default App
