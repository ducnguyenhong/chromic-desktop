import { Box, Flex, Icon, Image, Spinner, Text } from '@chakra-ui/react'
import FaviconHome from '@renderer/assets/home-favicon.webp'
import { Tab, useTabs } from '@renderer/state/tabs'
import { useMemo } from 'react'
import { AiOutlineClose } from 'react-icons/ai'

const TabItem: React.FC<{ item: Tab; index: number }> = ({ item, index }) => {
  const { id, isLoading, url, title } = item
  const { tabs, activeId } = useTabs()
  const isActive = id === activeId
  const activeIndex = tabs.findIndex((i) => i.id === activeId)
  const favicon = useMemo(() => {
    if (url.includes('chromic_home.html')) {
      return FaviconHome
    }
    return `https://www.google.com/s2/favicons?domain=${url.slice(0, -1)}&sz=128`
  }, [url])

  const handleActivate = async (id: string) => {
    await window.tabs.activate(id)
  }

  const handleClose = async (id: string) => {
    await window.tabs.close(id)
  }

  return (
    <Flex
      key={id}
      bgColor={isActive ? '#FFF' : '#e6e6e6'}
      gap={2}
      cursor="default"
      userSelect="none"
      pr="12px"
      pl="11px"
      borderRadius={0}
      borderTopRadius={9}
      justify="flex-start"
      align="center"
      h="32px"
      w="220px"
      pos="relative"
      onClick={() => handleActivate(id)}
    >
      <Flex flex={1} align="center" mt="-2px">
        {isLoading ? (
          <Box mt="4px">
            <Spinner color="green.700" size="sm" />
          </Box>
        ) : (
          <Image src={favicon} w="16px" h="16px" alt="favicon" />
        )}

        <Text lineClamp={1} color="#000" fontWeight={400} fontSize={12} ml="8px">
          {title || 'New Tab'}
        </Text>
      </Flex>
      {tabs.length > 1 && (
        <Flex
          w="17px"
          h="17px"
          align="center"
          justify="center"
          borderRadius="full"
          pos="relative"
          top="-2px"
          right="-12px"
          zIndex={1000}
          transitionDuration="200ms"
          _hover={{ bgColor: isActive ? '#d9d9d9' : '#ccc' }}
        >
          <Icon
            onClick={(e) => {
              e.stopPropagation()
              handleClose(id)
            }}
          >
            <AiOutlineClose color="#000" size={11} />
          </Icon>
        </Flex>
      )}

      {!isActive && activeIndex !== index + 1 ? (
        <Box h="16px" w="2px" bgColor="#CCC" pos="relative" right="-12px" zIndex={3} />
      ) : (
        <Box h="16px" w="2px" bgColor="transparent" pos="relative" right="-12px" zIndex={3} />
      )}

      <Box
        h="full"
        w="10px"
        bgColor={isActive ? '#FFF' : '#e6e6e6'}
        pos="absolute"
        bottom={0}
        left="-9px"
        zIndex={2}
      >
        <Box h="full" w="full" pos="relative">
          <Box
            h="full"
            w="full"
            bgColor={activeIndex === index - 1 ? '#FFF' : '#e6e6e6'}
            borderTopEndRadius={isActive ? 0 : 50}
            borderBottomEndRadius={isActive ? 50 : 0}
            pos="absolute"
            top={0}
            left={0}
          />
        </Box>
      </Box>

      {isActive && (
        <Box h="full" w="9px" bgColor="#FFF" pos="absolute" bottom={0} right="-9px" zIndex={2}>
          <Box h="full" w="full" pos="relative">
            <Box
              h="full"
              w="full"
              bgColor="#e6e6e6"
              borderBottomLeftRadius={50}
              pos="absolute"
              top={0}
              left={0}
            />
          </Box>
        </Box>
      )}
    </Flex>
  )
}

export default TabItem
