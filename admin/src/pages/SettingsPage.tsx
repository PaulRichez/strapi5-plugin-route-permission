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
  const [dialogType, setDialogType] = useState<'restore' | 'soft' | 'hard'>('restore');

  const handleRestoreClick = () => {
    setDialogType('restore');
    setIsDialogOpen(true);
  };

  const handleSoftCleanupClick = () => {
    setDialogType('soft');
    setIsDialogOpen(true);
  };

  const handleHardCleanupClick = () => {
    setDialogType('hard');
    setIsDialogOpen(true);
  };

  const handleConfirmRestore = async () => {
    try {
      setIsLoading(true);
      let endpoint = '';
      let successMessage = '';
      
      switch (dialogType) {
        case 'restore':
          endpoint = '/strapi5-plugin-route-permission/restore';
          successMessage = formatMessage({
            id: getTranslation('page.settings.notification.restore'),
            defaultMessage: 'Route permissions restored successfully'
          });
          break;
        case 'soft':
          endpoint = '/strapi5-plugin-route-permission/cleanup-soft';
          successMessage = formatMessage({
            id: getTranslation('page.settings.notification.cleanup.soft'),
            defaultMessage: 'Soft cleanup completed successfully'
          });
          break;
        case 'hard':
          endpoint = '/strapi5-plugin-route-permission/cleanup-hard';
          successMessage = formatMessage({
            id: getTranslation('page.settings.notification.cleanup.hard'),
            defaultMessage: 'Hard cleanup completed successfully'
          });
          break;
      }
      
      await post(endpoint);
      
      toggleNotification({
        type: 'success',
        message: successMessage
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error:', error);
      toggleNotification({
        type: 'warning',
        message: 'An error occurred while processing the request'
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
      <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius marginBottom={4}>
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

      {/* Soft Cleanup Section */}
      <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius marginBottom={4}>
        <Box marginBottom={4}>
          <Typography variant="beta" textColor="neutral800">
            {formatMessage({
              id: getTranslation('page.settings.section.cleanup.soft'),
              defaultMessage: 'Soft Cleanup'
            })}
          </Typography>
          
          <Box marginTop={3}>
            <Typography variant="omega" textColor="neutral600">
              {formatMessage({
                id: getTranslation('page.settings.section.cleanup.soft.subtitle'),
                defaultMessage: 'Removes external permissions while preserving Strapi native permissions (users, roles, auth, etc.)'
              })}
            </Typography>
          </Box>
        </Box>
        
        <Flex justifyContent="flex-start">
          <Button
            variant="secondary"
            onClick={handleSoftCleanupClick}
            loading={isLoading}
          >
            {formatMessage({
              id: getTranslation('page.settings.actions.cleanup.soft'),
              defaultMessage: 'Soft Cleanup'
            })}
          </Button>
        </Flex>
      </Box>

      {/* Hard Cleanup Section */}
      <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
        <Box marginBottom={4}>
          <Typography variant="beta" textColor="neutral800">
            {formatMessage({
              id: getTranslation('page.settings.section.cleanup.hard'),
              defaultMessage: 'Hard Cleanup'
            })}
          </Typography>
          
          <Box marginTop={3}>
            <Typography variant="omega" textColor="neutral600">
              {formatMessage({
                id: getTranslation('page.settings.section.cleanup.hard.subtitle'),
                defaultMessage: 'Removes ALL external permissions, keeping only those managed by this plugin. Use with caution!'
              })}
            </Typography>
          </Box>
        </Box>
        
        <Flex justifyContent="flex-start">
          <Button
            variant="danger"
            onClick={handleHardCleanupClick}
            loading={isLoading}
          >
            {formatMessage({
              id: getTranslation('page.settings.actions.cleanup.hard'),
              defaultMessage: 'Hard Cleanup'
            })}
          </Button>
        </Flex>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Content>
          <Dialog.Header>
            {formatMessage({
              id: getTranslation(`page.settings.actions.${dialogType}.confirmation.header`),
              defaultMessage: dialogType === 'restore' ? 'Restore default configuration' : 
                            dialogType === 'soft' ? 'Soft Cleanup Confirmation' : 
                            'Hard Cleanup Confirmation'
            })}
          </Dialog.Header>
          <Dialog.Body>
            <Typography>
              {formatMessage({
                id: getTranslation(`page.settings.actions.${dialogType}.confirmation.description`),
                defaultMessage: dialogType === 'restore' ? 'By restoring the data, all permissions will be immediately reconfigured based on your current route configuration' :
                              dialogType === 'soft' ? 'This will remove external permissions while preserving Strapi native permissions. Plugin permissions will remain untouched.' :
                              'This will remove ALL external permissions, keeping only those managed by this plugin. This action cannot be undone!'
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
              <Button 
                variant={dialogType === 'hard' ? 'danger' : dialogType === 'restore' ? 'danger' : 'default'} 
                onClick={handleConfirmRestore} 
                loading={isLoading}
              >
                {formatMessage({
                  id: getTranslation(`page.settings.actions.${dialogType}.confirmation.button.confirm`),
                  defaultMessage: dialogType === 'restore' ? 'Yes, I want to restore' :
                                dialogType === 'soft' ? 'Yes, soft cleanup' :
                                'Yes, hard cleanup'
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
