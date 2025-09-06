import { Flex, Icon, Image, Input, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { FaGoogle } from 'react-icons/fa6'
import { IoApps, IoHome } from 'react-icons/io5'
import { LuSearch } from 'react-icons/lu'
import Logo from '../../assets/logo.png'

const HomePage: React.FC = () => {
  const [keyword, setKeyword] = useState<string>('')

  const onSearch = () => {
    window.tabs.navigateCurrent(
      `https://www.google.com/search?q=${encodeURIComponent(keyword.trim())}`
    )
  }

  return (
    <Flex
      direction="column"
      align="center"
      justify="space-between"
      h="100vh"
      w="100vw"
      bgColor="#FFF"
    >
      <Flex align="center" justify="space-between" w="full" px="32px" pt="24px">
        <Flex cursor="pointer">
          <IoHome size={22} color="#666666" />
        </Flex>

        <Flex align="center" gap="26px">
          <Flex cursor="pointer">
            <IoApps size={22} color="#666666" />
          </Flex>
          <Flex cursor="pointer">
            <FaGoogle size={20} color="#666666" />
          </Flex>
        </Flex>
      </Flex>

      <Flex w="full" direction="column" align="center" justify="center" flex={1} gap="40px">
        <Flex className="logo-animate" align="center" gap="24px" mt="-15%" userSelect="none">
          <Image src={Logo} w="64px" h="64px" />
          <Text as="h1" fontSize={56} fontWeight={700}>
            Chromic
          </Text>
        </Flex>

        <Flex w="38%" pos="relative">
          <Input
            w="full"
            h="54px"
            pl="24px"
            pr="50px"
            fontSize={17}
            fontWeight={400}
            pb="2px"
            color="#000"
            placeholder="Tìm kiếm hoặc nhập một URL"
            border="1px solid #e6e6e6"
            boxShadow="md"
            borderRadius="full"
            _focus={{ outline: 'none' }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && keyword.trim()) {
                onSearch()
              }
            }}
          />

          <Icon pos="absolute" top="14px" right="18px" cursor="pointer" onClick={onSearch}>
            <LuSearch color="green" size={24} />
          </Icon>
        </Flex>
      </Flex>

      <Text textAlign="center" fontSize={14} color="#4d4d4d" pb="20px">
        Chromic browser 0.0.1 - Powered by{' '}
        <Text as="span" fontSize={14} fontWeight={500}>
          Landify
        </Text>
      </Text>
    </Flex>
  )
}

export default HomePage
