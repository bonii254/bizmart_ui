import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Typography,
  Tag,
  Input,
  Row,
  Col,
  Button,
  DatePicker,
  Select,
  Space,
  Statistic,
  message,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  FilterOutlined,
  InboxOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import * as XLSX from 'xlsx';

import { useInventoryTransactions } from '../../Components/Hooks/useReports';
import {
  InventoryTransaction,
  InventoryTransactionQueryParams,
  InventoryTransactionType,
} from '../../types/reports';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const InventoryTransactionsBrowse: React.FC = () => {
  // Query Parameters State (Server-side)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [warehouseIdInput, setWarehouseIdInput] = useState<string>('');
  const [itemIdInput, setItemIdInput] = useState<string>('');

  // Local Table Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Construct query parameters
  const queryParams = useMemo<InventoryTransactionQueryParams>(() => {
    return {
      fromDate: dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
      toDate: dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
      warehouseId: warehouseIdInput.trim() || undefined,
      itemId: itemIdInput.trim() || undefined,
    };
  }, [dateRange, warehouseIdInput, itemIdInput]);

  // Fetch Data using TanStack Query Hook
  const { data: transactions = [], isLoading, isFetching, refetch } = useInventoryTransactions(queryParams);

  // Filter options for Transaction Type dropdown
  const transactionTypeOptions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    const types = Array.from(new Set(transactions.map((item) => item.transaction_type).filter(Boolean)));
    return types.map((type) => ({
      label: type.replace('_', ' ').toUpperCase(),
      value: type,
    }));
  }, [transactions]);

  // Client-side Filtered Dataset
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];

    return transactions.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.item_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.warehouse_code?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = !selectedType || item.transaction_type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, selectedType]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let inflowQty = 0;
    let outflowQty = 0;
    let netValue = 0;

    filteredTransactions.forEach((t) => {
      const qty = t.quantity || 0;
      const unitCost = t.unit_cost || 0;
      if (qty > 0) {
        inflowQty += qty;
      } else {
        outflowQty += Math.abs(qty);
      }
      netValue += qty * unitCost;
    });

    return {
      totalCount: filteredTransactions.length,
      inflowQty,
      outflowQty,
      netValue,
    };
  }, [filteredTransactions]);

  const fmt = (v: number) =>
    (v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Type Tag Renderer
  const renderTypeTag = (type: InventoryTransactionType) => {
    switch (type?.toLowerCase()) {
      case 'goods_receipt':
        return <Tag color="success">GOODS RECEIPT</Tag>;
      case 'sale':
        return <Tag color="error">SALE</Tag>;
      case 'stock_take':
        return <Tag color="processing">STOCK TAKE</Tag>;
      default:
        return <Tag color="default">{type?.replace('_', ' ').toUpperCase() || 'N/A'}</Tag>;
    }
  };

  // Export to Excel
  const handleExportToExcel = () => {
    if (!filteredTransactions.length) {
      message.warning('No inventory transaction data available to export');
      return;
    }

    try {
      const exportData = filteredTransactions.map((item) => {
        const postedAtFormatted =
          item.posted_at && dayjs(item.posted_at).isValid()
            ? dayjs(item.posted_at).format('DD/MM/YYYY HH:mm')
            : 'N/A';
        const qty = item.quantity || 0;
        const unitCost = item.unit_cost || 0;

        return {
          'Posted At': postedAtFormatted,
          'Transaction Type': item.transaction_type ? item.transaction_type.replace('_', ' ').toUpperCase() : 'N/A',
          'Reference Number': item.reference_number || 'N/A',
          Warehouse: item.warehouse_code || 'N/A',
          'Item Code': item.item_code || 'N/A',
          Description: item.description || '',
          UOM: item.stock_uom || 'N/A',
          Quantity: qty,
          'Unit Cost (Ksh)': unitCost,
          'Total Cost (Ksh)': qty * unitCost,
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [
        { wch: 18 }, { wch: 18 }, { wch: 18 },
        { wch: 14 }, { wch: 16 }, { wch: 28 },
        { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 18 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Transactions');
      XLSX.writeFile(wb, `Inventory_Transactions_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
      message.success('Inventory transactions exported successfully!');
    } catch {
      message.error('Failed to export inventory transactions to Excel');
    }
  };

  const columns: ColumnsType<InventoryTransaction> = [
    {
      title: 'Posted At',
      dataIndex: 'posted_at',
      key: 'posted_at',
      render: (val) => (val ? dayjs(val).format('DD/MM/YYYY HH:mm') : 'N/A'),
      sorter: (a, b) => dayjs(a.posted_at).unix() - dayjs(b.posted_at).unix(),
    },
    {
      title: 'Type',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      render: (type) => renderTypeTag(type),
    },
    {
      title: 'Reference No.',
      dataIndex: 'reference_number',
      key: 'reference_number',
      render: (text) => <Text strong>{text || 'N/A'}</Text>,
      sorter: (a, b) => (a.reference_number || '').localeCompare(b.reference_number || ''),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_code',
      key: 'warehouse_code',
      render: (val) => <Tag color="purple">{val || 'N/A'}</Tag>,
    },
    {
      title: 'Item Code',
      dataIndex: 'item_code',
      key: 'item_code',
      render: (val) => <Text code>{val || 'N/A'}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (val) => val || 'N/A',
    },
    {
      title: 'UOM',
      dataIndex: 'stock_uom',
      key: 'stock_uom',
      align: 'center',
      render: (val) => (val ? <Tag>{val}</Tag> : 'N/A'),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: (val) => (
        <Text style={{ fontWeight: 'bold', color: val < 0 ? '#cf1322' : '#3f8600' }}>
          {val > 0 ? `+${val}` : val ?? 0}
        </Text>
      ),
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Unit Cost (Ksh)',
      dataIndex: 'unit_cost',
      key: 'unit_cost',
      align: 'right',
      render: (val) => fmt(val),
      sorter: (a, b) => a.unit_cost - b.unit_cost,
    },
    {
      title: 'Total Cost (Ksh)',
      key: 'total_cost',
      align: 'right',
      render: (_, record) => {
        const total = (record.quantity || 0) * (record.unit_cost || 0);
        return <Text strong style={{ color: total < 0 ? '#cf1322' : 'inherit' }}>{fmt(total)}</Text>;
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <InboxOutlined /> Inventory Transactions Browse
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                onClick={() => refetch()}
                loading={isFetching}
                icon={<ReloadOutlined />}
              >
                Reload
              </Button>
              <Button
                type="default"
                onClick={handleExportToExcel}
                icon={<FileExcelOutlined />}
                disabled={!filteredTransactions.length}
              >
                Export Excel
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Server Query Filters */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Date Range</Text>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              format="YYYY-MM-DD"
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Warehouse ID</Text>
            <Input
              placeholder="e.g. WH-02"
              value={warehouseIdInput}
              onChange={(e) => setWarehouseIdInput(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Item ID</Text>
            <Input
              placeholder="e.g. STK-MILK-001"
              value={itemIdInput}
              onChange={(e) => setItemIdInput(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Transactions"
              value={metrics.totalCount}
              valueStyle={{ fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Inflow Qty"
              value={metrics.inflowQty}
              valueStyle={{ color: '#3f8600', fontSize: '20px' }}
              prefix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Outflow Qty"
              value={metrics.outflowQty}
              valueStyle={{ color: '#cf1322', fontSize: '20px' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Net Cost Movement"
              value={metrics.netValue}
              precision={2}
              prefix="Ksh"
              valueStyle={{ fontSize: '20px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table Local Filters & Data Table */}
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={14}>
            <Input
              placeholder="Search Reference No, Item Code, Description, Warehouse..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={10}>
            <Select
              placeholder="Filter by Transaction Type"
              style={{ width: '100%' }}
              value={selectedType}
              onChange={(val) => setSelectedType(val)}
              allowClear
              options={transactionTypeOptions}
              suffixIcon={<FilterOutlined />}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredTransactions}
          rowKey={(record, idx) => `${record.transaction_id || record.reference_number}-${idx}`}
          loading={isLoading || isFetching}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100'],
            showTotal: (total) => `Total ${total} transactions`,
          }}
          size="small"
          bordered
        />
      </Card>
    </div>
  );
};

export default InventoryTransactionsBrowse;