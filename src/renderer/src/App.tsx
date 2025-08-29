import { Flex, VStack } from '@chakra-ui/react'
import AddressBar from './components/common/address-bar'
import NavControls from './components/common/nav-controls'
import TabBar from './components/common/tab-bar'

const App: React.FC = () => {
  return (
    <VStack align="stretch" h="100vh" w="full">
      <TabBar />
      <Flex w="full">
        <NavControls />
        <Flex flex={1}>
          <AddressBar />
        </Flex>
      </Flex>
    </VStack>
  )
}

export default App
