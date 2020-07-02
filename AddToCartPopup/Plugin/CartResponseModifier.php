<?php

namespace BelVG\AddToCartPopup\Plugin;

class CartResponseModifier
{
    private $serializer;

    private $messageManager;

    public function __construct(
        \Magento\Framework\Serialize\Serializer\Json $serializer,
        \Magento\Framework\Message\ManagerInterface $messageManager
    ) {
        $this->serializer = $serializer;
        $this->messageManager = $messageManager;
    }

    /**
     * @return array
     */
    private function collectMessages()
    {
        $result = [];
        $messages = $this->messageManager->getMessages(true);
        foreach ($messages->getItems() as $message) {
            $result[] = [
                'type' => $message->getType(),
                'text' => $message->getText()
            ];
        }

        return $result;
    }

    /**
     * @param array $content
     * @return array
     */
    private function prepareResponseContent(array $content)
    {
        // and loading messages via customer data
        $content['messages'] = $this->collectMessages();

        return $content;
    }

    public function afterExecute(
        \Magento\Checkout\Controller\Cart\Add $subject,
        $result
    ) {
        /** @var \Magento\Framework\App\Request\Http $request */
        $request = $subject->getRequest();
        /** @var \Magento\Framework\App\Response\Http */
        $response = $subject->getResponse();

        if (!$request->isAjax() ||
            !$response instanceof \Magento\Framework\App\Response\Http
        ) {
            return $result;
        }

        $content = [];
        if ($response->getContent()) {
            $content = $this->serializer->unserialize($response->getContent());
        }

        $content = $this->prepareResponseContent($content); //plugin reason

        $response->setContent($this->serializer->serialize($content));
        return $result;
    }
}
