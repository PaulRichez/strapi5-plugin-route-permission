import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { 
  Box,
  Typography,
  Button,
  Flex,
  Dialog,
} from '@strapi/design-system';
import { ArrowClockwise } from '@strapi/icons';
import { getTranslation } from '../utils/getTranslation';

const SettingsPage = () => {
  const { formatMessage } = useIntl();
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRestoreClick = () => {
    setIsDialogOpen(true);
  };

  const handleConfirmRestore = async () => {
    try {
      setIsLoading(true);
      await post('/strapi5-plugin-route-permission/restore');
      
      toggleNotification({
        type: 'success',
        message: formatMessage({
          id: getTranslation('page.settings.notification.restore'),
          defaultMessage: 'Configurated routes permissions history deleted'
        })
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error restoring permissions:', error);
      toggleNotification({
        type: 'warning',
        message: 'An error occurred while restoring permissions'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRestore = () => {
    setIsDialogOpen(false);
  };

  return (
    <Box padding={8} background="neutral100" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Box marginBottom={6}>
        <Typography variant="alpha" textColor="neutral800">
          {formatMessage({ 
            id: getTranslation('page.settings.title'), 
            defaultMessage: 'Routes permissions settings' 
          })}
        </Typography>
      </Box>
      
      {/* Content */}
      <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
        <Box marginBottom={4}>
          <Typography variant="beta" textColor="neutral800">
            {formatMessage({
              id: getTranslation('page.settings.section.restore'),
              defaultMessage: 'Restore routes permisisons history'
            })}
          </Typography>
          
          <Box marginTop={3}>
            <Typography variant="omega" textColor="neutral600">
              {formatMessage({
                id: getTranslation('page.settings.section.restore.subtitle'),
                defaultMessage: 'Removes the history of the configured routes, on the next restart, the permissions will be reset with your route config'
              })}
            </Typography>
          </Box>
        </Box>
        
        <Flex justifyContent="flex-start">
          <Button
            variant="danger-light"
            startIcon={<ArrowClockwise />}
            onClick={handleRestoreClick}
            loading={isLoading}
          >
            {formatMessage({
              id: getTranslation('page.settings.actions.restore'),
              defaultMessage: 'Restore routes permisisons history'
            })}
          </Button>
        </Flex>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Content>
          <Dialog.Header>
            {formatMessage({
              id: getTranslation('page.settings.actions.restore.confirmation.header'),
              defaultMessage: 'Restore default configuration'
            })}
          </Dialog.Header>
          <Dialog.Body>
            <Typography>
              {formatMessage({
                id: getTranslation('page.settings.actions.restore.confirmation.description'),
                defaultMessage: 'By restoring the data, on the next reboot, all permissions will be reconfigured'
              })}
            </Typography>
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.Cancel>
              <Button variant="tertiary" onClick={handleCancelRestore}>
                {formatMessage({
                  id: getTranslation('page.settings.actions.restore.confirmation.button.cancel'),
                  defaultMessage: 'Cancel'
                })}
              </Button>
            </Dialog.Cancel>
            <Dialog.Action>
              <Button variant="danger" onClick={handleConfirmRestore} loading={isLoading}>
                {formatMessage({
                  id: getTranslation('page.settings.actions.restore.confirmation.button.confirm'),
                  defaultMessage: 'Yes, I want to restore'
                })}
              </Button>
            </Dialog.Action>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
};

export { SettingsPage };

export default SettingsPage;
