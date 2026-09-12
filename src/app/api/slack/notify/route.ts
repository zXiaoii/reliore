import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      task,
      submittedBy = 'Yzah (Creative)',
      customWebhookUrl,
      isTest = false,
    } = body;

    const webhookUrl =
      customWebhookUrl ||
      process.env.SLACK_WEBHOOK_URL ||
      '';

    const driveUrl = task?.folderUrl?.trim() || 'https://drive.google.com';
    const campaignName = task?.campaign || 'CBO FlexiVita 3';
    const product = task?.product || 'FlexiVita';
    const quantity = task?.quantityDone || task?.quantity || 8;
    const creativeTypes = Array.isArray(task?.creativeTypes) ? task.creativeTypes.join(' + ') : 'Swipes + Concepts';
    const notes = task?.creativeNotes || 'All cuts rendered and uploaded to Google Drive.';
    const winningHook = task?.winningHook || 'European grandmother morning habit';

    // Rich Slack Block Kit payload
    const slackPayload = {
      text: isTest
        ? `🔔 Test Slack notification from Media Buying Operations!`
        : `🎨 Yzah delivered ${quantity} new creative cuts for ${campaignName}!`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: isTest
              ? '🔔 Media Ops — Slack Integration Test'
              : '🎨 New Creative Output Delivered to Media Buyer!',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Product:*\n${product} ${task?.market ? `(${task.market})` : ''}`,
            },
            {
              type: 'mrkdwn',
              text: `*Campaign:*\n\`${campaignName}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Submitted By:*\n${submittedBy}`,
            },
            {
              type: 'mrkdwn',
              text: `*Format & Qty:*\n${creativeTypes} (${quantity} cuts)`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Winning Hook / Angle:*\n> _"${winningHook}"_`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Creative Notes from Yzah:*\n${notes}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📁 View Drive Folder',
                emoji: true,
              },
              url: driveUrl.startsWith('http') ? driveUrl : 'https://drive.google.com',
              style: 'primary',
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Media Buying Ops • Pipeline Task #${task?.taskNumber || '001'} • Single Source of Truth`,
            },
          ],
        },
      ],
    };

    if (!webhookUrl) {
      // Return simulated success with the generated payload for testing
      return NextResponse.json({
        ok: true,
        simulated: true,
        message:
          'Slack webhook URL not set yet. Paste your Slack incoming webhook in Settings to send directly to your channel.',
        preview: slackPayload,
      });
    }

    // Send real POST request to Slack incoming webhook
    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
    });

    if (!slackRes.ok) {
      const errText = await slackRes.text();
      return NextResponse.json(
        { ok: false, error: `Slack API error: ${errText}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      simulated: false,
      message: 'Slack notification posted successfully to channel!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to dispatch Slack notification' },
      { status: 500 }
    );
  }
}
