import React, { useState, useEffect, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useFetchClient } from '@strapi/strapi/admin';
import {
  Box,
  Typography,
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  Loader,
  Button,
  Flex,
  TextInput,
} from '@strapi/design-system';
import { Page } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';
import { getTranslation } from '../utils/getTranslation';

// Types
interface RoutePermission {
  permission: string;
  role: string;
  status: 'active' | 'inactive' | 'role-not-found' | 'external';
}

// Custom Pagination Component
const CustomPagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const { formatMessage } = useIntl();

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <Flex alignItems="center" gap={2} justifyContent="center">
      <Button
        variant="tertiary"
        size="S"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        {formatMessage({
          id: getTranslation('page.homePage.pagination.previous'),
          defaultMessage: 'Previous'
        })}
      </Button>

      {generatePageNumbers().map((page, index) => (
        <div key={index}>
          {page === '...' ? (
            <Typography variant="pi" textColor="neutral600" paddingLeft={2} paddingRight={2}>
              ...
            </Typography>
          ) : (
            <Button
              variant={currentPage === page ? "default" : "tertiary"}
              size="S"
              onClick={() => onPageChange(page as number)}
              style={{
                minWidth: '32px',
                backgroundColor: currentPage === page ? '#4945ff' : 'transparent',
                color: currentPage === page ? 'white' : '#32324d'
              }}
            >
              {page}
            </Button>
          )}
        </div>
      ))}

      <Button
        variant="tertiary"
        size="S"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        {formatMessage({
          id: getTranslation('page.homePage.pagination.next'),
          defaultMessage: 'Next'
        })}
      </Button>
    </Flex>
  );
};

// Status Icon Component
const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  const { formatMessage } = useIntl();

  let backgroundColor = 'neutral500'; // default
  let tooltipMessage = '';

  switch (status) {
    case 'active':
      backgroundColor = 'success500';
      tooltipMessage = formatMessage({
        id: getTranslation('status-icon.tooltip.status.1'),
        defaultMessage: 'Permission enabled'
      });
      break;
    case 'inactive':
      backgroundColor = 'danger500';
      tooltipMessage = formatMessage({
        id: getTranslation('status-icon.tooltip.status.2'),
        defaultMessage: 'Permission disabled from admin panel'
      });
      break;
    case 'role-not-found':
      backgroundColor = 'warning500';
      tooltipMessage = formatMessage({
        id: getTranslation('status-icon.tooltip.status.3'),
        defaultMessage: 'Role doesn\'t exist'
      });
      break;
    case 'external':
      backgroundColor = 'secondary500';
      tooltipMessage = formatMessage({
        id: getTranslation('status-icon.tooltip.status.4'),
        defaultMessage: 'External permission (not managed by plugin)'
      });
      break;
  }

  return (
    <Box
      width="12px"
      height="12px"
      borderRadius="50%"
      background={backgroundColor}
      title={tooltipMessage}
      style={{ cursor: 'help' }}
    />
  );
};

const HomePage = () => {
  const { formatMessage } = useIntl();
  const { get } = useFetchClient();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('');
  const [permissionFilter, setPermissionFilter] = useState('');
  
  // Applied filter states (only updated when search button is clicked)
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('all');
  const [appliedRoleFilter, setAppliedRoleFilter] = useState('');
  const [appliedPermissionFilter, setAppliedPermissionFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const queryParams = {
          sort: 'permission:ASC',
          pageSize: pageSize,
          page: currentPage,
          status: appliedStatusFilter !== 'all' ? appliedStatusFilter : undefined,
          role: appliedRoleFilter || undefined,
          permission: appliedPermissionFilter || undefined,
        };
        
        // Remove undefined values
        const cleanParams = Object.fromEntries(
          Object.entries(queryParams).filter(([_, value]) => value !== undefined)
        );
        
        const queryString = new URLSearchParams(cleanParams as any).toString();
        const response = await get(`/strapi5-plugin-route-permission/configured-routes?${queryString}`);

        // console.log('API Response:', response); // Debug log

        // useFetchClient might return the data in response.data
        setData(response.data || response);
      } catch (error) {
        console.error('Error fetching configured routes:', error);
        setData({
          data: {
            result: [],
            pagination: {
              total: 0,
              pageCount: 0,
            },
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [get, currentPage, pageSize, appliedStatusFilter, appliedRoleFilter, appliedPermissionFilter]);

  const clearFilters = () => {
    setStatusFilter('all');
    setRoleFilter('');
    setPermissionFilter('');
    setAppliedStatusFilter('all');
    setAppliedRoleFilter('');
    setAppliedPermissionFilter('');
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setAppliedStatusFilter(statusFilter);
    setAppliedRoleFilter(roleFilter);
    setAppliedPermissionFilter(permissionFilter);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
  };

  if (isLoading) {
    return (
      <Page.Main>
        <Box padding={8} background="neutral100" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader>Loading route permissions...</Loader>
        </Box>
      </Page.Main>
    );
  }

  console.log('Current data state:', data); // Debug log

  return (
    <Page.Main>
      <Page.Title>
        {formatMessage({
          id: getTranslation('plugin.name'),
          defaultMessage: 'Route Permissions'
        })}
      </Page.Title>

      <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
        <Box marginBottom={4}>
          <Typography variant="alpha">
            {formatMessage({
              id: getTranslation('plugin.name'),
              defaultMessage: 'Route Permissions'
            })}
          </Typography>
        </Box>
        <Box marginBottom={4}>
          <Typography variant="omega" textColor="neutral600">
            {`${data?.data?.pagination?.total || 0} ${formatMessage({
              id: getTranslation('page.homePage.header.count'),
              defaultMessage: 'configured routes'
            })}`}
          </Typography>
        </Box>
        
        {/* Filters Section */}
        <Box marginBottom={4} padding={4} background="neutral100" hasRadius>
          <Typography variant="delta" marginBottom={3}>
            {formatMessage({
              id: getTranslation('page.homePage.filters.title'),
              defaultMessage: 'Filters'
            })}
          </Typography>
          
          <Flex gap={4} wrap="wrap">
            {/* Status Filter */}
            <Box minWidth="200px">
              <Typography variant="pi" fontWeight="bold" marginBottom={1}>
                {formatMessage({
                  id: getTranslation('page.homePage.filters.status'),
                  defaultMessage: 'Filter by status:'
                })}
              </Typography>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  handleFilterChange();
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #dcdce4',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  color: '#32324d'
                }}
              >
                <option value="all">
                  {formatMessage({
                    id: getTranslation('page.homePage.filters.status.all'),
                    defaultMessage: 'All statuses'
                  })}
                </option>
                <option value="active">
                  {formatMessage({
                    id: getTranslation('page.homePage.filters.status.active'),
                    defaultMessage: 'Active'
                  })}
                </option>
                <option value="inactive">
                  {formatMessage({
                    id: getTranslation('page.homePage.filters.status.inactive'),
                    defaultMessage: 'Inactive'
                  })}
                </option>
                <option value="role-not-found">
                  {formatMessage({
                    id: getTranslation('page.homePage.filters.status.role-not-found'),
                    defaultMessage: 'Role not found'
                  })}
                </option>
                <option value="external">
                  {formatMessage({
                    id: getTranslation('page.homePage.filters.status.external'),
                    defaultMessage: 'External'
                  })}
                </option>
              </select>
            </Box>

            {/* Role Filter */}
            <Box minWidth="200px">
              <Typography variant="pi" fontWeight="bold" marginBottom={1}>
                {formatMessage({
                  id: getTranslation('page.homePage.filters.role'),
                  defaultMessage: 'Filter by role:'
                })}
              </Typography>
              <TextInput
                placeholder="Enter role name..."
                value={roleFilter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setRoleFilter(e.target.value);
                }}
              />
            </Box>

            {/* Permission Filter */}
            <Box minWidth="200px">
              <Typography variant="pi" fontWeight="bold" marginBottom={1}>
                {formatMessage({
                  id: getTranslation('page.homePage.filters.permission'),
                  defaultMessage: 'Filter by permission:'
                })}
              </Typography>
              <TextInput
                placeholder="Enter permission name..."
                value={permissionFilter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setPermissionFilter(e.target.value);
                }}
              />
            </Box>

            {/* Search and Clear Buttons */}
            <Box alignSelf="end">
              <Flex gap={2}>
                <Button
                  variant="default"
                  onClick={handleSearch}
                >
                  {formatMessage({
                    id: getTranslation('page.homePage.filters.search'),
                    defaultMessage: 'Search'
                  })}
                </Button>
                <Button
                  variant="secondary"
                  onClick={clearFilters}
                >
                  {formatMessage({
                    id: getTranslation('page.homePage.filters.clear'),
                    defaultMessage: 'Clear filters'
                  })}
                </Button>
              </Flex>
            </Box>
          </Flex>
        </Box>
        
        <Table colCount={3} rowCount={data?.data?.result?.length || 0}>
          <Thead>
            <Tr>
              <Th>
                <Typography variant="sigma" textColor="neutral600">
                  {formatMessage({
                    id: getTranslation('page.homePage.table.header.permission'),
                    defaultMessage: 'Permission'
                  })}
                </Typography>
              </Th>
              <Th>
                <Typography variant="sigma" textColor="neutral600">
                  {formatMessage({
                    id: getTranslation('page.homePage.table.header.role'),
                    defaultMessage: 'Role'
                  })}
                </Typography>
              </Th>
              <Th>
                <Typography variant="sigma" textColor="neutral600">
                  {formatMessage({
                    id: getTranslation('page.homePage.table.header.status'),
                    defaultMessage: 'Status'
                  })}
                </Typography>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {(data?.data?.result || []).map((row: RoutePermission, index: number) => (
              <Tr key={index}>
                <Td>
                  <Typography textColor="neutral800">
                    {row.permission}
                  </Typography>
                </Td>
                <Td>
                  <Typography textColor="neutral800">
                    {row.role}
                  </Typography>
                </Td>
                <Td>
                  <StatusIcon status={row.status} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {data?.data?.pagination && data.data.pagination.pageCount > 1 && (
          <Box marginTop={4} display="flex" justifyContent="center">
            <CustomPagination
              currentPage={currentPage}
              totalPages={data.data.pagination.pageCount}
              onPageChange={setCurrentPage}
            />
          </Box>
        )}

        <Flex marginTop={4} justifyContent="space-between" alignItems="center">
          <Typography variant="pi" textColor="neutral600">
            {formatMessage(
              {
                id: getTranslation('page.homePage.pagination.showing'),
                defaultMessage: 'Showing {start} to {end} of {total} entries'
              },
              {
                start: Math.min((currentPage - 1) * pageSize + 1, data?.data?.pagination?.total || 0),
                end: Math.min(currentPage * pageSize, data?.data?.pagination?.total || 0),
                total: data?.data?.pagination?.total || 0
              }
            )}
          </Typography>

          <Flex alignItems="center" gap={2}>
            <Typography variant="pi" textColor="neutral600">
              {formatMessage({
                id: getTranslation('page.homePage.pagination.pageSize'),
                defaultMessage: 'Entries per page:'
              })}
            </Typography>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when changing page size
              }}
              style={{
                padding: '4px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </Flex>
        </Flex>
      </Box>
    </Page.Main>
  );
};

export { HomePage };

export default HomePage;
